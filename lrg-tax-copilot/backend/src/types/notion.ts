export interface NotionRichText {
  type: string;
  plain_text: string;
  href: string | null;
}

export interface NotionTitle {
  id: string;
  type: 'title';
  title: NotionRichText[];
}

export interface NotionRichTextProperty {
  id: string;
  type: 'rich_text';
  rich_text: NotionRichText[];
}

export interface NotionSelect {
  id: string;
  type: 'select';
  select: {
    id: string;
    name: string;
    color: string;
  } | null;
}

export interface NotionMultiSelect {
  id: string;
  type: 'multi_select';
  multi_select: Array<{
    id: string;
    name: string;
    color: string;
  }>;
}

export interface NotionNumber {
  id: string;
  type: 'number';
  number: number | null;
}

export interface NotionCheckbox {
  id: string;
  type: 'checkbox';
  checkbox: boolean;
}

export interface NotionDate {
  id: string;
  type: 'date';
  date: {
    start: string;
    end: string | null;
  } | null;
}

export interface NotionRelation {
  id: string;
  type: 'relation';
  relation: Array<{
    id: string;
  }>;
}

export type NotionProperty =
  | NotionTitle
  | NotionRichTextProperty
  | NotionSelect
  | NotionMultiSelect
  | NotionNumber
  | NotionCheckbox
  | NotionDate
  | NotionRelation;

export interface ParsedPolicy {
  id: string;
  name: string;
  category: string;
  content: string;
  guardrailFlags: string[];
  effectiveDate: string | null;
  isActive: boolean;
}

export interface ParsedTemplate {
  id: string;
  name: string;
  mode: string;
  templateBody: string;
  placeholders: string[];
  relatedPolicyId: string | null;
}

export interface ParsedPricingRule {
  id: string;
  name: string;
  serviceType: string;
  basePrice: number | null;
  conditions: string;
  guardrailFlags: string[];
}

export interface ParsedTopicBrief {
  id: string;
  name: string;
  topic: string;
  summary: string;
  keyPoints: string[];
  relatedPolicyIds: string[];
}
