import { db } from '../firebase/config';
import { collection, getDocs } from 'firebase/firestore';

describe('Firebase Connection', () => {
  it('can connect to Firestore', async () => {
    const testCollection = collection(db, 'test');
    const snapshot = await getDocs(testCollection);
    expect(snapshot).toBeDefined();
  });
}); 