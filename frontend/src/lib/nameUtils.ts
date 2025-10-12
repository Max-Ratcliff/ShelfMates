/**
 * Formats a full name to "First L." format
 * Examples:
 * - "Avlyn Singer" -> "Avlyn S."
 * - "Max Ratcliff" -> "Max R."
 * - "Edmond" -> "Edmond"
 */
export function formatNameWithInitial(fullName: string): string {
  if (!fullName) return '';

  const parts = fullName.trim().split(/\s+/);

  if (parts.length === 1) {
    return parts[0];
  }

  const firstName = parts[0];
  const lastInitial = parts[parts.length - 1].charAt(0).toUpperCase();

  return `${firstName} ${lastInitial}.`;
}
