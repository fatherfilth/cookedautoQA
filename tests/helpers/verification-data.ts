/**
 * Fake identity data for verification form completion in auth setup.
 *
 * Test accounts are disposable, so real identity data is not needed.
 * Values are hardcoded for simplicity (no randomization required).
 */
export function getVerificationData() {
  return {
    firstName: 'Smoke',
    lastName: 'Test',
    dateOfBirth: {
      day: '01',
      month: '01',
      year: '1990',
    },
    address: {
      line1: '123 Test Street',
      city: 'London',
      postcode: 'SW1A 1AA',
      // Country: keep default (likely UK/GB pre-selected)
    },
  };
}
