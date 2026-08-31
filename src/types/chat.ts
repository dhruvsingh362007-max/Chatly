export interface Message {
  messageId: string;
  connectionId: string;
  senderUid: string;
  message: string;
  createdAt: number;
  isDelivered?: boolean;
  isRead?: boolean;
}

export interface IcebreakerSuggestion {
  id: string;
  interestMatch: string;
  text: string;
  emoji: string;
}
