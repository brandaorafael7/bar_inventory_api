import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { StoreSetting, StoreSettingDocument } from './schemas/store-setting.schema';

@Injectable()
export class SettingsService {
  constructor(
    @InjectModel(StoreSetting.name)
    private readonly settingModel: Model<StoreSettingDocument>,
  ) {}

  async getSettings(): Promise<StoreSetting> {
    let settings = await this.settingModel.findOne().exec();
    if (!settings) {
      settings = await this.settingModel.create({ storeName: 'Meu Bar & Tabacaria' });
    }
    return settings;
  }

  async updateSettings(data: Partial<StoreSetting>): Promise<StoreSetting> {
    let settings = await this.settingModel.findOne().exec();
    if (!settings) {
      return this.settingModel.create(data);
    }
    Object.assign(settings, data);
    return settings.save();
  }
}