import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class InstagramService {
  private graphBase = 'https://graph.facebook.com/v21.0';
  private token: string;

  constructor(private config: ConfigService, private http: HttpService) {
    this.token = config.get('INSTAGRAM_ACCESS_TOKEN') || '';
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
}
