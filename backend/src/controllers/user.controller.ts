import { Request, Response } from 'express';
import { userRepository } from '../repositories/user.repository';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess, sendCreated } from '../utils/apiResponse';
import { AppError } from '../utils/AppError';
import { uploadToCloudinary } from '../middleware/upload.middleware';

export const userController = {
  getProfile: asyncHandler(async (req: Request, res: Response) => {
    const user = await userRepository.findById(req.user!.userId);
    if (!user) throw new AppError('User not found', 404);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _ph, ...pub } = user;
    sendSuccess(res, pub, 'Profile retrieved');
  }),

  updateProfile: asyncHandler(async (req: Request, res: Response) => {
    const updated = await userRepository.update(req.user!.userId, req.body);
    if (!updated) throw new AppError('No changes made', 400);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _ph, ...pub } = updated;
    sendSuccess(res, pub, 'Profile updated');
  }),

  uploadAvatar: asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) throw new AppError('No image file provided', 400);

    const imageUrl = await uploadToCloudinary(
      req.file.buffer,
      'quickbite/avatars',
      `user-${req.user!.userId}`
    );

    const updated = await userRepository.update(req.user!.userId, { avatarUrl: imageUrl });
    if (!updated) throw new AppError('Avatar update failed', 500);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _ph, ...pub } = updated;
    sendSuccess(res, pub, 'Avatar updated');
  }),

  // ── Addresses ──────────────────────────────────────────────────
  getAddresses: asyncHandler(async (req: Request, res: Response) => {
    const addresses = await userRepository.findAddressesByUser(req.user!.userId);
    sendSuccess(res, addresses, 'Addresses retrieved');
  }),

  createAddress: asyncHandler(async (req: Request, res: Response) => {
    const address = await userRepository.createAddress({
      userId:    req.user!.userId,
      label:     req.body.label ?? 'Home',
      flatHouse: req.body.flatHouse,
      street:    req.body.street,
      area:      req.body.area,
      city:      req.body.city,
      state:     req.body.state,
      pinCode:   req.body.pinCode,
      isDefault: req.body.isDefault ?? false,
    });
    sendCreated(res, address, 'Address added');
  }),

  deleteAddress: asyncHandler(async (req: Request, res: Response) => {
    const deleted = await userRepository.deleteAddress(req.params.id!, req.user!.userId);
    if (!deleted) throw new AppError('Address not found', 404);
    sendSuccess(res, null, 'Address deleted');
  }),
};
