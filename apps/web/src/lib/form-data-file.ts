/**
 * Node 18 / bazı ortamlarda global `File` tanımlı olmayabilir;
 * `instanceof File` ReferenceError verebilir. FormData parçası Blob olarak kontrol edilir.
 */
export function getFormDataBlob(entry: FormDataEntryValue | null): Blob | null {
  if (entry === null || typeof entry !== 'object') return null;
  if (typeof Blob !== 'undefined' && entry instanceof Blob) {
    return entry;
  }
  return null;
}

export function formDataBlobName(blob: Blob): string {
  const n = (blob as { name?: unknown }).name;
  return typeof n === 'string' && n.trim() ? n : 'media';
}
