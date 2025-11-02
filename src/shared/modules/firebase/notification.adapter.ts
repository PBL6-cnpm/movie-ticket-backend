import { DEFAULT_APP_NAME, FIREBASE_APP } from '@common/constants';
import { convertValuesToStrings } from '@common/utils';
import { Inject, Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { MulticastMessage } from 'firebase-admin/lib/messaging/messaging-api';

export interface ISendFirebaseMessageByTokens<T> {
  fcmTokens: string[];
  message: string;
  title: string;
  data?: T;
}

@Injectable()
export class NotificationAdapter {
  private defaultAppName: string = DEFAULT_APP_NAME;

  constructor(@Inject(FIREBASE_APP) private readonly firebaseApp: admin.app.App) {}

  async sendNotificationByTokens<T extends { [key: string]: string } | undefined>(
    payload: ISendFirebaseMessageByTokens<T>
  ) {
    const { data = {}, fcmTokens, title = this.defaultAppName, message } = payload;
    if (!(fcmTokens && fcmTokens.length)) {
      return;
    }

    const chunkSize = 500;
    const arrayFcmTokens: string[][] = [];
    for (let i = 0; i < fcmTokens.length; i += chunkSize) {
      arrayFcmTokens.push(fcmTokens.slice(i, i + chunkSize));
    }

    const expiredTokens: string[] = [];
    for (const arrayToken of arrayFcmTokens) {
      const notification: MulticastMessage = {
        tokens: arrayToken,
        notification: {
          title,
          body: message
        },
        data: convertValuesToStrings(data),
        webpush: { notification: { click_action: null } },
        android: { notification: { sound: 'default' } },
        apns: { payload: { aps: { sound: 'default' } } }
      };

      const response = await this.firebaseApp.messaging().sendEachForMulticast(notification);

      if (response.failureCount > 0) {
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            expiredTokens.push(arrayToken[idx]);
          }
        });
      }
    }

    return expiredTokens;
  }
}
