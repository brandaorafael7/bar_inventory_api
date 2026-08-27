import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product, ProductDocument } from '../products/schemas/product.schema';
import {
  StockMovement,
  StockMovementDocument,
  MovementType,
} from '../stock-movements/schemas/stock-movement.schema';

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
    @InjectModel(StockMovement.name)
    private readonly movementModel: Model<StockMovementDocument>,
  ) {}

  async getMetrics() {
    const totalProducts = await this.productModel.countDocuments({ isActive: true });

    const lowStockCount = await this.productModel.countDocuments({
      isActive: true,
      $expr: { $lte: ['$currentStock', '$minStock'] },
    });

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Usando o enum MovementType.SALE ou cast seguro
    const recentSales = await this.movementModel
      .find({
        type: 'SALE' as any,
        createdAt: { $gte: sevenDaysAgo },
      })
      .populate('product')
      .exec();

    let totalRevenue = 0;
    const daysMap: Record<string, number> = {};
    const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    // Inicializa os últimos 7 dias com zero
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const label = weekDays[d.getDay()];
      daysMap[label] = 0;
    }

    recentSales.forEach((mov: any) => {
      if (mov.product) {
        const price = mov.product.dayPrice || 0;
        const total = price * mov.quantity;
        totalRevenue += total;

        const dayName = weekDays[new Date(mov.createdAt).getDay()];
        if (daysMap[dayName] !== undefined) {
          daysMap[dayName] += total;
        }
      }
    });

    const chartData = Object.entries(daysMap).map(([dia, vendas]) => ({
      dia,
      vendas: Number(vendas.toFixed(2)),
    }));

    const totalMovementsCount = await this.movementModel.countDocuments();
    const totalLossesCount = await this.movementModel.countDocuments({
      type: 'LOSS' as any,
    });

    const lossRate =
      totalMovementsCount > 0
        ? ((totalLossesCount / totalMovementsCount) * 100).toFixed(1)
        : '0.0';

    return {
      totalProducts,
      lowStockCount,
      estimatedRevenue: totalRevenue.toFixed(2),
      lossRate: `${lossRate}%`,
      chartData,
    };
  }
}