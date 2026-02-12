const TOKEN_PATTERN = /(\d+|\D+)/g;

const tokenize = (value: string): string[] => {
  const matched = value.match(TOKEN_PATTERN);
  return matched ?? [value];
};

const isNumericToken = (token: string): boolean => /^\d+$/.test(token);

export const compareScriptNo = (left: string, right: string): number => {
  const a = tokenize(left);
  const b = tokenize(right);
  const max = Math.max(a.length, b.length);

  for (let i = 0; i < max; i += 1) {
    const partA = a[i];
    const partB = b[i];

    if (partA === undefined) {
      return -1;
    }
    if (partB === undefined) {
      return 1;
    }

    const numA = isNumericToken(partA);
    const numB = isNumericToken(partB);

    if (numA && numB) {
      const diff = Number(partA) - Number(partB);
      if (diff !== 0) {
        return diff;
      }
      if (partA.length !== partB.length) {
        return partA.length - partB.length;
      }
      continue;
    }

    if (numA !== numB) {
      return numA ? -1 : 1;
    }

    const compared = partA.localeCompare(partB, 'ja');
    if (compared !== 0) {
      return compared;
    }
  }

  return left.localeCompare(right, 'ja');
};
