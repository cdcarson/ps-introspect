
export const validateNonEmptyString = (value: string) => {
  if (value.trim().length === 0) {
    return 'Required.'
  }
}
