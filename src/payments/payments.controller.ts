import { Controller, Get, Post, Body, Param, Request, UseGuards, Response, Query } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { ApiBearerAuth, ApiExcludeEndpoint, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/auth.guard';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { PaymentStatus } from './enums/payments.enum';
import { ChatSignupDto } from './dto/chat-signup.dto';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @ApiExcludeEndpoint()
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @Post('bkash-create-payment')
  createBkashPayment(@Request() req, @Body() createPaymentDto: CreatePaymentDto) {
    return this.paymentsService.createBkashPayment(req.user.sub,  createPaymentDto);
  }

  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @Post('shurjopay-create-payment')
  createShurjoPayPayment(@Request() req, @Body() createPaymentDto: CreatePaymentDto, @Response() res) {
    return this.paymentsService.createShurjoPayPayment(req.user.sub,  createPaymentDto, res);
  }

  @Post('shurjopay-create-payment/users/:id')
  createShurjoPayPaymentForUser(@Param('id') userId: number, @Body() createPaymentDto: CreatePaymentDto, @Response() res) {
    return this.paymentsService.createShurjoPayPayment(userId,  createPaymentDto, res);
  }

  @ApiBearerAuth()
  @Post('shurjopay-verify-payment/:sp_transaction_id')
  shurjoPayVerifyPayment(@Param('sp_transaction_id') sp_transaction_id: string,  @Response() res) {
    return this.paymentsService.verifyShurjoPayPayment(sp_transaction_id, res);
  }

  @Get('shurjopay-ipn')
  shurjoPayIpn(@Query('order_id') sp_transaction_id: string,  @Response() res) {
    return this.paymentsService.verifyShurjoPayPayment(sp_transaction_id, res);
  }

  @ApiExcludeEndpoint()
  @Post('bkash-create-payment/users/:id')
  createBkashPaymentForUser(@Param('id') userId: number, @Body() createPaymentDto: CreatePaymentDto) {
    return this.paymentsService.createBkashPayment(userId,  createPaymentDto);
  }

  

  @ApiExcludeEndpoint()
  @Post('bkash-exuecute-payment/:paymentId')
  executeBkashPayment(@Param('paymentId') paymentId: number, @Body() createPaymentDto: CreatePaymentDto) {
    return this.paymentsService.createBkashPayment(paymentId,  createPaymentDto);
  }


  @ApiBearerAuth()
  @Get('my-payments')
  @UseGuards(AuthGuard)
  paymentHistoryOfUser(@Request() req, @Query() paginationDto: PaginationDto) {
    return this.paymentsService.getPaymentsOfAUser( req.user.sub, paginationDto);
  }

  
  @Get('/my-invoice/:courseId')
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  findOne(@Request() req,  @Param('courseId') courseId: number) {
    return this.paymentsService.getInvoice(req.user.sub, courseId);
  }

  @Post('chat-signup')
  chatSignup(@Request() req, @Body() payload: ChatSignupDto) {
    return this.paymentsService.chatSignup(payload);
  }
  
}
