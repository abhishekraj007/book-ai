export interface QuestionOption {
  id: string;
  label: string;
  icon?: string;
  description?: string;
}

export interface QuestionCardMetadata {
  messageType: "question_card";
  questionId: string;
  options: QuestionOption[];
  allowCustomInput?: boolean;
  multiSelect?: boolean;
}

export interface QuestionCardMessage {
  role: "assistant";
  content: string;
  metadata?: QuestionCardMetadata;
}
