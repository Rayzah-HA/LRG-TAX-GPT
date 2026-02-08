import {
  NotionProperty,
  NotionRichText,
  ParsedPolicy,
  ParsedTemplate,
  ParsedPricingRule,
  ParsedTopicBrief,
} from '../types/notion';

// ─── Helper functions for extracting Notion property values ─────

type PropertyMap = Record<string, NotionProperty>;

export function extractTitle(properties: PropertyMap, key: string): string {
  const prop = properties[key];
  if (!prop || prop.type !== 'title') return '';
  return prop.title.map((t: NotionRichText) => t.plain_text).join('');
}

export function extractRichText(properties: PropertyMap, key: string): string {
  const prop = properties[key];
  if (!prop || prop.type !== 'rich_text') return '';
  return prop.rich_text.map((t: NotionRichText) => t.plain_text).join('');
}

export function extractSelect(properties: PropertyMap, key: string): string {
  const prop = properties[key];
  if (!prop || prop.type !== 'select' || !prop.select) return '';
  return prop.select.name;
}

export function extractMultiSelect(
  properties: PropertyMap,
  key: string
): string[] {
  const prop = properties[key];
  if (!prop || prop.type !== 'multi_select') return [];
  return prop.multi_select.map((s) => s.name);
}

export function extractDate(properties: PropertyMap, key: string): string | null {
  const prop = properties[key];
  if (!prop || prop.type !== 'date' || !prop.date) return null;
  return prop.date.start;
}

export function extractNumber(
  properties: PropertyMap,
  key: string
): number | null {
  const prop = properties[key];
  if (!prop || prop.type !== 'number') return null;
  return prop.number;
}

export function extractCheckbox(
  properties: PropertyMap,
  key: string
): boolean {
  const prop = properties[key];
  if (!prop || prop.type !== 'checkbox') return false;
  return prop.checkbox;
}

export function extractRelations(
  properties: PropertyMap,
  key: string
): string[] {
  const prop = properties[key];
  if (!prop || prop.type !== 'relation') return [];
  return prop.relation.map((r) => r.id);
}

// ─── Parser functions for each database type ────────────────────

export function parsePolicy(
  id: string,
  properties: PropertyMap
): ParsedPolicy {
  return {
    id,
    name: extractTitle(properties, 'Name') || extractTitle(properties, 'Policy Name'),
    category: extractSelect(properties, 'Category'),
    content: extractRichText(properties, 'Content') || extractRichText(properties, 'Policy Text'),
    guardrailFlags: extractMultiSelect(properties, 'Guardrail Flags'),
    effectiveDate: extractDate(properties, 'Effective Date'),
    isActive: extractSelect(properties, 'Status') === 'Active',
  };
}

export function parseTemplate(
  id: string,
  properties: PropertyMap
): ParsedTemplate {
  return {
    id,
    name: extractTitle(properties, 'Name') || extractTitle(properties, 'Template Name'),
    mode: extractSelect(properties, 'Mode') || extractSelect(properties, 'Interaction Mode'),
    templateBody: extractRichText(properties, 'Template Body') || extractRichText(properties, 'Body'),
    placeholders: extractMultiSelect(properties, 'Placeholders'),
    relatedPolicyId: extractRelations(properties, 'Related Policy')[0] || null,
  };
}

export function parsePricingRule(
  id: string,
  properties: PropertyMap
): ParsedPricingRule {
  return {
    id,
    name: extractTitle(properties, 'Name') || extractTitle(properties, 'Rule Name'),
    serviceType: extractSelect(properties, 'Service Type'),
    basePrice: extractNumber(properties, 'Base Price'),
    conditions: extractRichText(properties, 'Conditions') || extractRichText(properties, 'Rules'),
    guardrailFlags: extractMultiSelect(properties, 'Guardrail Flags'),
  };
}

export function parseTopicBrief(
  id: string,
  properties: PropertyMap
): ParsedTopicBrief {
  return {
    id,
    name: extractTitle(properties, 'Name') || extractTitle(properties, 'Topic Name'),
    topic: extractSelect(properties, 'Topic Tag') || extractSelect(properties, 'Topic'),
    summary: extractRichText(properties, 'Summary') || extractRichText(properties, 'Brief'),
    keyPoints: extractMultiSelect(properties, 'Key Points'),
    relatedPolicyIds: extractRelations(properties, 'Related Policies'),
  };
}
