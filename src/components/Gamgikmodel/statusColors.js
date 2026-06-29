export const STATUS_LABELS = {
  normal: '정상',
  allow: '검토필요',
  masking: '마스킹',
  block: '차단',
};

export const STATUS_COLORS = {
  normal: '#4338CA',
  allow: '#06B6D4',
  masking: '#F59E0B',
  block: '#FF4D4F',
};

export const STATUS_TEXT_CLASS_NAMES = {
  normal: 'text-[#4338CA]',
  allow: 'text-[#06B6D4]',
  masking: 'text-[#F59E0B]',
  block: 'text-[#FF4D4F]',
};

export function getStatusKeyFromLabel(label) {
  if (label === STATUS_LABELS.normal) return 'normal';
  if (label === STATUS_LABELS.allow || label === '허용') return 'allow';
  if (label === STATUS_LABELS.masking) return 'masking';
  if (label === STATUS_LABELS.block) return 'block';
  return 'normal';
}

export function getStatusTextClassName(statusKeyOrLabel) {
  const statusKey = STATUS_TEXT_CLASS_NAMES[statusKeyOrLabel]
    ? statusKeyOrLabel
    : getStatusKeyFromLabel(statusKeyOrLabel);

  return STATUS_TEXT_CLASS_NAMES[statusKey] ?? STATUS_TEXT_CLASS_NAMES.normal;
}
