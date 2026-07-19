import { Request, Response, NextFunction } from 'express';

const mobileUploadBlocker = (req: Request, res: Response, next: NextFunction): void => {
  const userAgent = req.get('user-agent') || '';
  const isMobile = /android|iphone|ipad|mobile/i.test(userAgent);

  if (isMobile) {
    res.status(400).json({
      success: false,
      message: 'Image uploads are not supported on mobile devices',
    });
    return;
  }

  next();
};

export default mobileUploadBlocker;
