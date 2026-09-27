import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Product, ProductDocument } from '../products/schemas/product.schema';
import {
  StockMovement,
  StockMovementDocument,
} from '../stock-movements/schemas/stock-movement.schema';
import { MovementType } from '../common/enums/movement-type.enum';

interface DashboardProductSummary {
  _id: Types.ObjectId;
  name: string;
  dayPrice?: number;
}

interface PopulatedDashboardMovement {
  _id: Types.ObjectId;
  productId?: DashboardProductSummary | null;
  type: MovementType;
  quantity: number;
  createdAt: Date;
}

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
    @InjectModel(StockMovement.name)
    private readonly movementModel: Model<StockMovementDocument>,
  ) {}

  async getMetrics() {
    const totalProducts = await this.productModel.countDocuments({
      isActive: true,
    });

    const lowStockCount = await this.productModel.countDocuments({
      isActive: true,
      $expr: { $lte: ['$currentStock', '$minStock'] },
    });

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentSales = (await this.movementModel
      .find({
        type: MovementType.SAIDA,
        createdAt: { $gte: sevenDaysAgo },
      })
      .populate('productId', 'name dayPrice')
      .exec()) as unknown as PopulatedDashboardMovement[];

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

    recentSales.forEach((mov) => {
      if (mov.productId) {
        const price = mov.productId.dayPrice ?? 0;
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
      type: MovementType.PERDA,
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
