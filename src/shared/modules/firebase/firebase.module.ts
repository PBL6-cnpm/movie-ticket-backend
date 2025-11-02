import { DEFAULT_APP_NAME, FIREBASE_APP } from '@common/constants';
import { DynamicModule, Module } from '@nestjs/common';
import * as admin from 'firebase-admin';
import * as firebaseConfig from '../../../../firebase-sdk.json';
import { FirestoreService } from './firestore.service';
import { NotificationAdapter } from './notification.adapter';

@Module({})
export class FirebaseModule {
  static forRoot(database_name: string, defaultAppName: string = DEFAULT_APP_NAME): DynamicModule {
    return {
      module: FirebaseModule,
      global: true,
      providers: [
        {
          provide: FIREBASE_APP,
          useFactory: () => {
            if (admin.apps.length > 0) {
              try {
                return admin.app(defaultAppName);
              } catch (e) {
                console.log('Error: ', (e as Error).message);
                return admin.app();
              }
            }
            return admin.initializeApp(
              {
                credential: admin.credential.cert(firebaseConfig as admin.ServiceAccount)
              },
              defaultAppName
            );
          }
        },
        {
          provide: FirestoreService,
          useFactory: (firebaseApp: admin.app.App) => new FirestoreService(firebaseApp),
          inject: [FIREBASE_APP]
        },
        {
          provide: NotificationAdapter,
          useFactory: (firebaseApp: admin.app.App) => new NotificationAdapter(firebaseApp),
          inject: [FIREBASE_APP]
        }
      ],
      exports: [FirestoreService, NotificationAdapter]
    };
  }
}
