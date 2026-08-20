import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CategoriesModule } from './categories/categories.module';
import { ProductsModule } from './products/products.module';
import { StockMovementsModule } from './stock-movements/stock-movements.module';
import { SettingsModule } from './settings/settings.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), // <-- Adicione esta linha
    MongooseModule.forRoot(
      process.env.MONGO_URI ||
        'mongodb+srv://admin:admin123@cluster0.exemplo.mongodb.net/bar-inventory?retryWrites=true&w=majority',
    ),
    AuthModule,
    UsersModule,
    CategoriesModule,
    ProductsModule,
    StockMovementsModule,
    SettingsModule,
  ],
})
export class AppModule {}