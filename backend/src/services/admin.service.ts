import { restaurantRepository } from '../repositories/restaurant.repository';
import { userRepository } from '../repositories/user.repository';
import { AppError } from '../utils/AppError';
import { Restaurant, PublicUser } from '../types';

export const adminService = {
  async getAllRestaurants(opts: {
    approvalStatus?: string; page: number; limit: number;
  }): Promise<{ restaurants: Restaurant[]; total: number }> {
    return restaurantRepository.findAllForAdmin(opts);
  },

  async approveRestaurant(id: string): Promise<Restaurant> {
    const restaurant = await restaurantRepository.findById(id);
    if (!restaurant) throw new AppError('Restaurant not found', 404);
    if (restaurant.approvalStatus === 'approved') {
      throw new AppError('Restaurant is already approved', 400);
    }

    const updated = await restaurantRepository.setApprovalStatus(id, 'approved');
    if (!updated) throw new AppError('Update failed', 500);
    return updated;
  },

  async rejectRestaurant(id: string, reason: string): Promise<Restaurant> {
    if (!reason || reason.trim().length < 5) {
      throw new AppError('A rejection reason of at least 5 characters is required', 400);
    }

    const restaurant = await restaurantRepository.findById(id);
    if (!restaurant) throw new AppError('Restaurant not found', 404);

    const updated = await restaurantRepository.setApprovalStatus(id, 'rejected', reason);
    if (!updated) throw new AppError('Update failed', 500);
    return updated;
  },

  async getAllUsers(opts: {
    role?: string; page: number; limit: number;
  }): Promise<{ users: PublicUser[]; total: number }> {
    const { users, total } = await userRepository.findAll(opts);
    const publicUsers = users.map(u => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { passwordHash: _ph, ...pub } = u;
      return pub as PublicUser;
    });
    return { users: publicUsers, total };
  },

  async banUser(id: string): Promise<PublicUser> {
    const user = await userRepository.findById(id);
    if (!user) throw new AppError('User not found', 404);
    if (user.role === 'admin') throw new AppError('Cannot ban an admin user', 400);
    if (user.isBanned) throw new AppError('User is already banned', 400);

    const updated = await userRepository.setBanStatus(id, true);
    if (!updated) throw new AppError('Update failed', 500);

    // Revoke all refresh tokens — forces immediate logout
    await userRepository.revokeAllRefreshTokens(id);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _ph, ...pub } = updated;
    return pub as PublicUser;
  },

  async unbanUser(id: string): Promise<PublicUser> {
    const user = await userRepository.findById(id);
    if (!user) throw new AppError('User not found', 404);
    if (!user.isBanned) throw new AppError('User is not banned', 400);

    const updated = await userRepository.setBanStatus(id, false);
    if (!updated) throw new AppError('Update failed', 500);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _ph, ...pub } = updated;
    return pub as PublicUser;
  },
};
