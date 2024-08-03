import { HttpException, HttpStatus } from '@nestjs/common';

export class ResourceNotFoundException extends HttpException {
  constructor(resourceName: string) {
    super(`${resourceName} not found`, HttpStatus.NOT_FOUND);
  }
}
