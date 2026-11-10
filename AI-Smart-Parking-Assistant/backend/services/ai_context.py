"""
ParkWise AI - SQLite RAG Context Retrieval & Grounding Service
Extracts citation parameters, queries SQLite database tables (rules, violations, disputes),
and constructs grounded context for Google Gemini.
"""

import re
import json
from typing import List, Dict, Optional, Tuple


def get_all_municipal_rules(db) -> List[Dict]:
    """Retrieve all municipal parking guidelines from SQLite."""
    cursor = db.cursor()
    cursor.execute("""
        SELECT code, title, zone, hours, rate, fine_amount, grace_period_minutes, active, description
        FROM rules
        ORDER BY code ASC;
    """)
    rows = cursor.fetchall()
    return [dict(r) for r in rows]


def extract_rule_codes(query: str) -> List[str]:
    """
    Extract specific rule codes mentioned in query (e.g. PR-101, PR 102, Rule 103, PR-104).
    Returns list of normalized codes (e.g. ['PR-101', 'PR-102']).
    """
    raw = query.upper()
    matches = re.findall(r'PR[-_\s]?(\d{3})', raw)
    if not matches:
        matches = re.findall(r'RULE[-_\s]?(\d{3})', raw)
    
    unique_codes = []
    for m in matches:
        code = f"PR-{m}"
        if code not in unique_codes:
            unique_codes.append(code)
    return unique_codes


def is_greeting_or_intro(query: str) -> bool:
    """
    Detect whether the user is asking a greeting or identity / introduction question.
    Examples:
      - "Hello", "Hi", "Hey"
      - "Who are you?", "What are you?"
      - "Introduce yourself", "Tell me about yourself"
      - "What can you do?", "What do you do?"
    """
    q = query.lower().strip()
    clean = re.sub(r'[^a-z0-9\s]', '', q)
    words = clean.split()

    intro_phrases = [
        'who are you', 'what are you', 'introduce yourself', 'introduce you',
        'what is your name', 'tell me about yourself', 'what can you do',
        'what do you do', 'who created you', 'who made you', 'how can you help',
        'what is parkwise', 'about parkwise'
    ]
    if any(phrase in clean for phrase in intro_phrases):
        return True

    # Check standalone or short greetings
    greeting_words = {'hi', 'hello', 'hey', 'namaste', 'greetings', 'good morning', 'good afternoon', 'good evening', 'hola'}
    if any(clean == g or clean.startswith(g + ' ') for g in greeting_words):
        # Ensure it is not actually a specific citation or rule query
        rule_codes = extract_rule_codes(query)
        has_citation = bool(re.search(r'IND-VIO|\b(8841|7930|9104|6512|5402)\b', query.upper()))
        if not rule_codes and not has_citation and len(words) <= 5:
            return True

    return False


def find_relevant_rules(query: str, db) -> Tuple[List[Dict], str]:
    """
    Retrieve only the SQLite rules relevant to the user query.
    Returns:
        (relevant_rules_list, retrieval_mode)
        Modes: 'comparison', 'specific_rules', 'keyword_matched', 'general'
    """
    codes = extract_rule_codes(query)
    cursor = db.cursor()

    # 1. Multi-rule or single-rule extraction by code
    if codes:
        placeholders = ','.join(['?'] * len(codes))
        cursor.execute(f"""
            SELECT code, title, zone, hours, rate, fine_amount, grace_period_minutes, active, description
            FROM rules
            WHERE code IN ({placeholders})
            ORDER BY code ASC;
        """, codes)
        rows = cursor.fetchall()
        matched = [dict(r) for r in rows]
        if matched:
            mode = 'comparison' if len(matched) > 1 else 'specific_rules'
            return matched, mode

    # 2. Keyword relevance matching on rules
    q = query.lower()
    all_rules = get_all_municipal_rules(db)
    matched = []

    keyword_map = {
        'PR-101': ['grace', '10-minute', '10 min', 'meter', 'metered', 'commercial', 'overstay', 'kiosk', 'latency', 'mall road'],
        'PR-102': ['yellow', 'kerb', 'curb', 'tow', 'tow-away', 'arterial', 'prohibited zone', 'connaught'],
        'PR-103': ['emergency', 'hospital', 'hydrant', 'fire', 'ambulance', 'gate', 'mg road', 'obstruction'],
        'PR-104': ['ev', 'electric', 'charger', 'charging', 'battery', 'cyber city']
    }

    for r in all_rules:
        r_code = r['code']
        keywords = keyword_map.get(r_code, [])
        if any(kw in q for kw in keywords):
            matched.append(r)

    if matched:
        mode = 'comparison' if len(matched) > 1 else 'specific_rules'
        return matched, mode

    # 3. Fallback to active rules for general parking compliance questions
    return [r for r in all_rules if r['active']], 'general'


def extract_citation_or_plate(query: str) -> Optional[Dict]:
    """
    Extract citation identifier or vehicle plate from natural language query.
    Handles formats:
      - Full citation: IND-VIO-2024-8841, VIO-2024-8841, IND-VIO-8841
      - Short numbers: 8841, 7930, 9104, 6512, 5402
      - Plates: PB10AB1234, DL01CZ4592, PB10, DL01, etc.
    """
    q = query.upper().strip()

    # 1. Full Citation match
    full_match = re.search(r'IND-VIO-2024-\d{4}|IND-VIO-\d{4}|VIO-\d{4}', q)
    if full_match:
        return {'type': 'citation', 'value': full_match.group(0)}

    # 2. Known 4-digit demo violation suffixes
    suffix_match = re.search(r'\b(8841|7930|9104|6512|5402)\b', q)
    if suffix_match:
        return {'type': 'citation_suffix', 'value': suffix_match.group(0)}

    # 3. Indian plate format: 2 letters, 2 digits, optional letters/digits
    plate_match = re.search(r'\b([A-Z]{2}\s*\d{1,2}\s*[A-Z]{0,3}\s*\d{3,4})\b', q)
    if plate_match:
        cleaned_plate = re.sub(r'\s+', '', plate_match.group(0))
        return {'type': 'plate', 'value': cleaned_plate}

    return None


def find_matched_violation(query: str, db) -> Optional[Dict]:
    """Find specific violation in SQLite matching query entity."""
    entity = extract_citation_or_plate(query)
    if not entity:
        return None

    cursor = db.cursor()
    row = None

    if entity['type'] == 'citation':
        cursor.execute("""
            SELECT v.*, u.name as driver_name, u.email as driver_email,
                   veh.make as veh_make, veh.model as veh_model, veh.year as veh_year, veh.color as veh_color
            FROM violations v
            LEFT JOIN users u ON v.user_id = u.id
            LEFT JOIN vehicles veh ON v.vehicle_plate = veh.plate
            WHERE v.id = ?;
        """, (entity['value'],))
        row = cursor.fetchone()

    elif entity['type'] == 'citation_suffix':
        cursor.execute("""
            SELECT v.*, u.name as driver_name, u.email as driver_email,
                   veh.make as veh_make, veh.model as veh_model, veh.year as veh_year, veh.color as veh_color
            FROM violations v
            LEFT JOIN users u ON v.user_id = u.id
            LEFT JOIN vehicles veh ON v.vehicle_plate = veh.plate
            WHERE v.id LIKE ?;
        """, (f"%{entity['value']}",))
        row = cursor.fetchone()

    elif entity['type'] == 'plate':
        cursor.execute("""
            SELECT v.*, u.name as driver_name, u.email as driver_email,
                   veh.make as veh_make, veh.model as veh_model, veh.year as veh_year, veh.color as veh_color
            FROM violations v
            LEFT JOIN users u ON v.user_id = u.id
            LEFT JOIN vehicles veh ON v.vehicle_plate = veh.plate
            WHERE REPLACE(v.vehicle_plate, ' ', '') = ?
            ORDER BY v.issue_date DESC LIMIT 1;
        """, (entity['value'],))
        row = cursor.fetchone()

    if not row:
        return None

    v_data = dict(row)

    # Parse AI assessment if JSON string
    if v_data.get('ai_assessment'):
        if isinstance(v_data['ai_assessment'], str):
            try:
                v_data['ai_assessment'] = json.loads(v_data['ai_assessment'])
            except Exception:
                pass

    # Check for dispute records
    cursor.execute("SELECT * FROM disputes WHERE violation_id = ?;", (v_data['id'],))
    disp_row = cursor.fetchone()
    v_data['dispute'] = dict(disp_row) if disp_row else None

    return v_data


def build_system_prompt_and_context(query: str, db) -> Dict:
    """
    Constructs the grounded prompt for Gemini including SQLite municipal rules,
    citation dossier (if matched), and defensible guidelines.
    """
    greeting = is_greeting_or_intro(query)
    matched_violation = find_matched_violation(query, db)
    relevant_rules, retrieval_mode = find_relevant_rules(query, db)

    # Build context based on query intent
    rules_context = ""
    if greeting:
        rules_context = (
            "USER INTENT: The user is greeting you or asking for an introduction / overview of what you do.\n"
            "CONTEXT NOTE: Briefly introduce yourself as ParkWise AI. Do not dump the entire parking rules list.\n"
        )
    elif retrieval_mode == 'comparison':
        rules_context = f"### RELEVANT MUNICIPAL RULES RETRIEVED FROM SQLITE FOR COMPARISON ({len(relevant_rules)} rules):\n"
        for r in relevant_rules:
            status_str = "ACTIVE ENFORCED" if r['active'] else "TEMPORARILY SUSPENDED"
            rules_context += (
                f"- Code: {r['code']} ({r['title']}) [{status_str}]\n"
                f"  Zone: {r['zone']} | Enforcement Hours: {r['hours']}\n"
                f"  Base Fine: ₹{r['fine_amount']:.0f} | Grace Period: {r['grace_period_minutes']} minutes\n"
                f"  Description & Scope: {r['description']}\n\n"
            )
    else:
        rules_context = f"### RELEVANT MUNICIPAL PARKING RULES RETRIEVED FROM SQLITE ({len(relevant_rules)} rules):\n"
        for r in relevant_rules:
            status_str = "ACTIVE ENFORCED" if r['active'] else "TEMPORARILY SUSPENDED"
            rules_context += (
                f"- Code: {r['code']} ({r['title']}) [{status_str}]\n"
                f"  Zone: {r['zone']} | Enforcement Hours: {r['hours']}\n"
                f"  Base Fine: ₹{r['fine_amount']:.0f} | Grace Period: {r['grace_period_minutes']} minutes\n"
                f"  Description: {r['description']}\n\n"
            )

    # Format violation context if matched
    violation_context = ""
    source_ref = "Municipal Parking Guidelines Benchmark"
    primary_ref = "General Compliance Benchmark"
    matched_id = None

    if matched_violation:
        matched_id = matched_violation['id']
        fine = float(matched_violation.get('fine_amount') or 0.0)
        late = float(matched_violation.get('late_fee') or 0.0)
        total = fine + late
        source_ref = matched_violation.get('ordinance_code') or f"Guideline {matched_violation.get('id')}"
        primary_ref = f"{matched_violation.get('location')} ({matched_violation.get('vehicle_plate')})"

        ai_diag = matched_violation.get('ai_assessment') or {}
        grounds = ai_diag.get('legalGrounds', [])
        grounds_str = "\n".join([f"    * {g}" for g in grounds]) if grounds else "    * Standard curbside verification applies"

        violation_context = (
            f"### CITATION DOSSIER RETRIEVED FROM SQLITE FOR #{matched_violation['id']}:\n"
            f"- Vehicle Plate: {matched_violation['vehicle_plate']} ({matched_violation.get('veh_year', '')} {matched_violation.get('veh_make', '')} {matched_violation.get('veh_model', '')})\n"
            f"- Registered Driver: {matched_violation.get('driver_name', 'Amanpreet Singh')}\n"
            f"- Violation Type: {matched_violation['type']}\n"
            f"- Location & Zone: {matched_violation['location']} (GPS: {matched_violation.get('gps', 'N/A')})\n"
            f"- Issue Date: {matched_violation['issue_date']} | Status: {matched_violation['status']}\n"
            f"- Penalties: ₹{fine:.0f} fine + ₹{late:.0f} late fee = ₹{total:.0f} Total Due\n"
            f"- Applicable Ordinance: {matched_violation.get('ordinance_code', 'Rule PR-101')}\n"
            f"- Officer Description: {matched_violation.get('description', '')}\n"
            f"- Telematics Diagnostic: {ai_diag.get('summary', 'Curbside duration check.')}\n"
            f"- Defensible Appeal Grounds:\n{grounds_str}\n"
            f"- Recommended Dispute Path: {ai_diag.get('recommendedPath', 'Submit an informal demonstration review.')}\n"
            f"- Merit Rating: {ai_diag.get('confidenceScore', 85)}% Viability for Waiver\n"
        )
        if matched_violation.get('dispute'):
            disp = matched_violation['dispute']
            violation_context += (
                f"- Filed Dispute Status: {disp['status']}\n"
                f"- Driver Appeal Reason: {disp['reason']}\n"
                f"- Adjudicator Notes: {disp.get('adjudicator_notes', 'Pending officer review')}\n"
            )
    elif retrieval_mode == 'comparison':
        source_ref = "Rule Comparison Matrix"
        primary_ref = " vs ".join([r['code'] for r in relevant_rules])
    elif relevant_rules and retrieval_mode == 'specific_rules':
        source_ref = relevant_rules[0]['code']
        primary_ref = relevant_rules[0]['title']

    system_instruction = (
        "You are ParkWise AI, an expert, objective, explainable parking compliance assistant "
        "designed for the ParkWise AI municipal platform in India.\n\n"
        "RESPONSE INSTRUCTIONS BY USER QUERY TYPE:\n"
        "1. GREETINGS & INTRODUCTIONS ('Hello', 'Hi', 'Who are you?', 'Introduce yourself'):\n"
        "   - Give a warm, natural introduction as ParkWise AI.\n"
        "   - Explain your role: helping drivers and citizens understand parking regulations, explain specific citations, evaluate appeal viability, and navigate dispute submissions.\n"
        "   - Provide 2-3 quick example prompts they can ask (e.g. asking about ticket #8841, or comparing PR-101 and PR-102).\n"
        "   - DO NOT list or dump all parking rules in response to a simple greeting.\n\n"
        "2. COMPARISON QUESTIONS (e.g. 'Compare PR-101 and PR-102'):\n"
        "   - Provide a clear, structured side-by-side comparison (table or clear bullet points).\n"
        "   - Compare: Base Fine (₹), Grace Window (minutes), Zone / Location, Enforcement Hours, and Policy Scope.\n"
        "   - Highlight the key operational differences (e.g., payment latency grace under PR-101 vs strict zero-tolerance under PR-102).\n\n"
        "3. CITATION INQUIRIES (e.g. 'Explain violation IND-VIO-2024-8841'):\n"
        "   - Break down the infraction, fine amount, location, officer description, and defensible grounds from the SQLite dossier.\n"
        "   - Give step-by-step guidance on how the citizen can appeal or resolve the ticket.\n\n"
        "4. GENERAL GUIDANCE ('What should I do if I get a violation?'):\n"
        "   - Provide clear, actionable advice: review the evidence, check the grace window rule, gather documentation, and file a dispute or pay.\n\n"
        "CORE DIRECTIVES:\n"
        "- Base all fines, rules, and facts strictly on the provided SQLite ground truth. Never invent rules or fines.\n"
        "- State all monetary amounts in Indian Rupees (₹).\n"
        "- Format using clean, readable Markdown (headings, bullet points, bold keywords)."
    )

    full_context = f"{rules_context}\n{violation_context}".strip()

    return {
        'system_instruction': system_instruction,
        'context_data': full_context,
        'matched_violation': matched_violation,
        'relevant_rules': relevant_rules,
        'retrieval_mode': retrieval_mode,
        'is_greeting': greeting,
        'violation_id': matched_id,
        'source': source_ref,
        'reference': primary_ref,
        'suggested_actions': [
            {'label': 'Compare PR-101 & PR-102', 'query': 'What is the difference between PR-101 and PR-102?'},
            {'label': 'Analyze Ticket #8841', 'query': 'Why did I get ticket IND-VIO-2024-8841 on Mall Road?'},
            {'label': 'Hospital Gate Rule (PR-103)', 'query': 'Explain PR-103 emergency gate clearance rule.'},
            {'label': 'Dispute Guidance', 'query': 'What should I do if I receive a parking violation?'}
        ]
    }


def build_database_fallback_reply(query: str, context_info: dict) -> str:
    """
    High-quality database-grounded response generated directly from SQLite records
    when Google Gemini API is unavailable or unconfigured.
    """
    q = query.lower().strip()
    vio = context_info.get('matched_violation')
    rules = context_info.get('relevant_rules', [])
    mode = context_info.get('retrieval_mode', 'general')

    # 1. Greeting & Introduction
    if context_info.get('is_greeting') or is_greeting_or_intro(query):
        return (
            "Hello! I am **ParkWise AI**, your explainable smart parking compliance assistant.\n\n"
            "I help drivers, citizens, and municipal administrators understand curbside regulations with transparent, evidence-backed guidance. Here is what I can do for you:\n\n"
            "* **Explain Violations & Citations:** Look up any ticket (e.g. *\"Explain violation IND-VIO-2024-8841\"*) to inspect recorded evidence, fine breakdowns, and AI viability assessment.\n"
            "* **Compare & Clarify Rules:** Ask about specific regulations or comparisons (e.g. *\"Compare PR-101 and PR-102\"* or *\"Explain PR-103\"*).\n"
            "* **Guide Disputes & Appeals:** Learn the defensible grounds and evidence required to submit an appeal through the Driver Portal.\n\n"
            "How can I assist you with your parking inquiry today?"
        )

    # 2. Specific Citation Breakdown from SQLite
    if vio:
        fine = float(vio.get('fine_amount') or 0.0)
        late = float(vio.get('late_fee') or 0.0)
        ai_info = vio.get('ai_assessment') or {}
        grounds = ai_info.get('legalGrounds', ['Curbside compliance check.'])
        grounds_formatted = "\n".join([f"* **{g}**" for g in grounds])

        return (
            f"### Municipal Compliance Breakdown: Citation #{vio['id']}\n\n"
            f"**Vehicle:** {vio['vehicle_plate']} ({vio.get('veh_year', '')} {vio.get('veh_make', '')} {vio.get('veh_model', '')})  \n"
            f"**Recorded Infraction:** {vio['type']}  \n"
            f"**Location:** {vio['location']}  \n"
            f"**Penalty Assessed:** ₹{(fine + late):.0f} (Base Fine: ₹{fine:.0f} + Late Fee: ₹{late:.0f})  \n"
            f"**Status:** {vio['status']} | **Ordinance:** {vio.get('ordinance_code', 'Rule PR-101')}\n\n"
            f"#### Automated Evidence & Telematics Analysis:\n"
            f"{ai_info.get('summary', vio.get('description', 'Standard curbside evaluation.'))}\n\n"
            f"#### Defensible Appeal Grounds:\n"
            f"{grounds_formatted}\n\n"
            f"**Merit Rating:** **{ai_info.get('confidenceScore', 85)}% Viability for Waiver**  \n"
            f"**Recommended Next Step:** {ai_info.get('recommendedPath', 'Submit an informal review with documentation.')}\n\n"
            f"*(Retrieved from SQLite Database)*"
        )

    # 3. Multi-rule comparison (e.g. PR-101 vs PR-102)
    if mode == 'comparison' and len(rules) >= 2:
        rule_rows = ""
        for r in rules:
            rule_rows += (
                f"| **{r['code']}** | {r['title']} | ₹{r['fine_amount']:.0f} | {r['grace_period_minutes']} min | {r['zone']} | {r['hours']} |\n"
            )

        details = ""
        for r in rules:
            details += f"#### {r['code']}: {r['title']}\n* **Fine:** ₹{r['fine_amount']:.0f} (Grace: {r['grace_period_minutes']} minutes)\n* **Policy:** {r['description']}\n\n"

        return (
            f"### Rule Comparison: {' vs '.join([r['code'] for r in rules])}\n\n"
            f"| Guideline | Title | Base Penalty | Grace Period | Zone | Enforcement Hours |\n"
            f"| :--- | :--- | :--- | :--- | :--- | :--- |\n"
            f"{rule_rows}\n"
            f"### Key Operational Differences:\n\n"
            f"{details}"
            f"*(Retrieved from SQLite rules table)*"
        )

    # 4. Single Rule Inquiry (e.g. PR-101, PR-102, PR-103, PR-104)
    if rules and mode == 'specific_rules':
        r = rules[0]
        return (
            f"### Municipal Parking Guideline: {r['code']} - {r['title']}\n\n"
            f"* **Applicable Zone:** {r['zone']}\n"
            f"* **Enforcement Hours:** {r['hours']}\n"
            f"* **Base Fine:** ₹{r['fine_amount']:.0f}\n"
            f"* **Grace Period:** {r['grace_period_minutes']} minutes\n"
            f"* **Status:** {'Active Enforced' if r['active'] else 'Suspended'}\n\n"
            f"**Description & Scope:**\n"
            f"{r['description']}\n\n"
            f"*(Retrieved from SQLite rules table)*"
        )

    # 5. General violation guidance
    if any(k in q for k in ('receive', 'got', 'what should i do', 'dispute', 'appeal', 'how to', 'ticket')):
        return (
            "### What To Do If You Receive a Parking Violation in ParkWise AI\n\n"
            "If you receive a parking violation notice, follow these recommended steps:\n\n"
            "1. **Review Citation Details:** Check the ticket ID, vehicle plate, timestamp, and location in the **Driver Portal** to confirm accuracy.\n"
            "2. **Check Applicable Grace Periods:** Verify if a digital grace window applies (e.g., **Rule PR-101.B** grants 10 minutes for payment retries in metered bays).\n"
            "3. **Gather Evidence:** If you experienced payment app latency, obscured signage, or emergency halting, prepare relevant screenshots or timestamped photos.\n"
            "4. **Submit an Appeal:** Click **Dispute** on the violation details page, enter your statement, and attach supporting evidence for administrative review.\n"
            "5. **Demonstration Settlement:** If the citation is undisputed, you can demonstrate settlement via the **Pay Fine** action.\n\n"
            "*(ParkWise AI Compliance Guidance)*"
        )

    # 6. Default Fallback
    return (
        f"### ParkWise AI Parking Guidance\n\n"
        f"Regarding your question on **\"{query}\"**:\n\n"
        "ParkWise AI manages parking compliance based on active municipal guidelines in SQLite:\n"
        "* **Rule PR-101 (Metered Commercial Bay):** Base fine ₹500, 10-minute digital grace window.\n"
        "* **Rule PR-102 (Yellow Kerb Prohibited Zone):** Base fine ₹1,000, 0-minute grace (24/7 tow-away).\n"
        "* **Rule PR-103 (Emergency Gate Clearance):** Base fine ₹1,500, 3-meter clearance perimeter.\n"
        "* **Rule PR-104 (EV Charging Bay Compliance):** Base fine ₹750, 30-minute idle overstay buffer.\n\n"
        "*Tip: Ask me to compare rules (e.g. 'Compare PR-101 and PR-102') or examine ticket #8841.*"
    )
