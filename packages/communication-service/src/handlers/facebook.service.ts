import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class FacebookService {
  private graphBase = 'https://graph.facebook.com/v21.0';
  private token: string;

  constructor(private config: ConfigService, private http: HttpService) {
    this.token = config.get('FACEBOOK_PAGE_ACCESS_TOKEN') || '';
    this.graphBase = config.get('FACEBOOK_API_BASE_URL') || 'https://graph.facebook.com/v21.0';
  }

  async sendText(recipientId: string, text: string): Promise<any> {
    const { data } =     await firstValueFrom(
      this.http.post<any>(`${this.graphBase}/me/messages`, {
        recipient: { id: recipientId },
        message: { text },
      }, {
        headers: { Authorization: `Bearer ${this.token}`, 'Content-Type': 'application/json' },
      }),
    );
    return data;
  }

  async getUserProfile(userId: string): Promise<any> {
    const { data } =     await firstValueFrom(
      this.http.get<any>(`${this.graphBase}/${userId}`, {
        params: { fields: 'first_name,last_name,profile_pic', access_token: this.token },
      }),
    );
    return data;
  }
}
