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
    phone: '+35312345678',
    address: {
      line1: '123 Test Street',
      city: 'Dublin',
      state: 'Leinster',
      postcode: 'D01 F5P2',
      country: 'IE',
    },
  };
}
