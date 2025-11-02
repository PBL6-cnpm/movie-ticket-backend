import { FIREBASE_APP } from '@common/constants';
import { Inject, Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { Firestore } from 'firebase-admin/firestore';

@Injectable()
export class FirestoreService {
  public readonly db: Firestore;

  constructor(@Inject(FIREBASE_APP) private readonly firebaseApp: admin.app.App) {
    this.db = this.firebaseApp.firestore();
  }

  async getDoc<T = admin.firestore.DocumentData>(
    collection: string,
    path: string
  ): Promise<T | undefined> {
    const doc = await this.db.collection(collection).doc(path).get();
    if (!doc.exists) return undefined;
    return doc.data() as T;
  }

  async setDoc(collection: string, path: string, data: object): Promise<void> {
    await this.db.collection(collection).doc(path).set(data, { merge: true });
  }

  async addDoc<T extends admin.firestore.DocumentData>(
    collection: string,
    data: T
  ): Promise<admin.firestore.DocumentReference<T>> {
    const colRef = this.db.collection(collection) as admin.firestore.CollectionReference<T>;
    return await colRef.add(data);
  }

  getCollection<T extends admin.firestore.DocumentData>(
    collection: string
  ): admin.firestore.CollectionReference<T> {
    return this.db.collection(collection) as admin.firestore.CollectionReference<T>;
  }

  async updateDoc(collection: string, path: string, data: object): Promise<void> {
    await this.db.collection(collection).doc(path).update(data);
  }

  async deleteDoc(collection: string, path: string): Promise<void> {
    await this.db.collection(collection).doc(path).delete();
  }

  private async deleteDocAndSubCollections(docRef: admin.firestore.DocumentReference) {
    const subCollections = await docRef.listCollections();
    for (const subCol of subCollections) {
      const subDocRefs = await subCol.listDocuments();
      for (const subDocRef of subDocRefs) {
        await this.deleteDocAndSubCollections(subDocRef);
      }
    }
    await docRef.delete();
  }

  async dropCollection(collectionPath: string) {
    const collectionRef = this.db.collection(collectionPath);
    const docRefs = await collectionRef.listDocuments();
    for (const docRef of docRefs) {
      await this.deleteDocAndSubCollections(docRef);
    }
  }
}
