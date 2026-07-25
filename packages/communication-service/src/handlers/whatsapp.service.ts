import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class WhatsAppService {
  private baseUrl: string;
  private token: string;
  private phoneNumberId: string;

  constructor(private config: ConfigService, private http: HttpService) {
    this.token = config.get('WHATSAPP_ACCESS_TOKEN') || '';
    this.phoneNumberId = config.get('WHATSAPP_PHONE_NUMBER_ID') || '';
    const version = config.get('WHATSAPP_API_VERSION') || 'v21.0';
    this.baseUrl = `https://graph.facebook.com/${version}`;
  }

  async sendText(to: string, text: string, previewUrl = false): Promise<any> {
    const url = `${this.baseUrl}/${this.phoneNumberId}/messages`;
    const { data } = await firstValueFrom(
      this.http.post<any>(url, {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'text',
        text: { preview_url: previewUrl, body: text },
      }, {
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
      }),
    );
    return data;
  }

  async sendTemplate(to: string, templateName: string, language = 'en', components?: any[]): Promise<any> {
    const url = `${this.baseUrl}/${this.phoneNumberId}/messages`;
    const payload: any = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'template',
      template: { name: templateName, language: { code: language } },
    };
    if (components) payload.template.components = components;

    const { data } =     await firstValueFrom(
      this.http.post<any>(url, payload, {
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
      }),
    );
    return data;
  }

  async markAsRead(messageId: string): Promise<void> {
    const url = `${this.baseUrl}/${this.phoneNumberId}/messages`;
    await firstValueFrom(
      this.http.post<any>(url, {
        messaging_product: 'whatsapp',
        status: 'read',
        message_id: messageId,
      }, {
        headers: { Authorization: `Bearer ${this.token}` },
      }),
    );
  }
}
