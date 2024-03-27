import { generateDateList, getDateBefore } from 'src/common/utils/utils';
import { UsersService } from 'src/users/users.service';
import { NotificationGateway } from './../notification/notification.gateway';
import { NotificationReceiver, NotificationType } from './../notification/enums/notification.enums';
import { MailService } from 'src/mail/mail.service';
import { customAlphabet, urlAlphabet } from 'nanoid';
import { CreatePayoutRequestDto } from './dto/create-payput-request.dto';
import { Payout } from './entities/payout.entity';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { ConfigService } from '@nestjs/config';
import { Injectable, BadRequestException, Logger, NotFoundException } from '@nestjs/common';
import * as mysql from 'mysql2/promise';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, MoreThanOrEqual, Repository, In, Like } from 'typeorm';
import { PayoutStatus, PayoutTimePeriod } from './enums/earning-report.enum';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import * as moment from 'moment-timezone';
import { Enrollment } from 'src/enrollments/entities/enrollment.entity';

@Injectable()
export class EarningReportsService {
  private linkShortnerConnection;
  logger = new Logger(EarningReportsService.name)
  constructor(
    private configService: ConfigService,
    private mailService: MailService,
    private notificationGateway: NotificationGateway,
    private eventEmitter: EventEmitter2,
    private usersService: UsersService,
    @InjectRepository(Enrollment) private enrollmentRepository: Repository<Enrollment>,
    @InjectRepository(Payout) private payoutRepository: Repository<Payout>) 
  {

    eventEmitter.on('user.emailChanged', async (payload) => {
      if(payload.email && payload.userId) {
        await this.linkShortnerQuery('UPDATE short_links SET username = ? WHERE userId = ?', [payload.email, payload.userId])
      }
    })

  }
  private async createConnectionToLinkShortner() {
    this.linkShortnerConnection = await mysql.createConnection({
      host: this.configService.get('SHORTNER_DB_HOST'),
      user: this.configService.get('SHORTNER_DB_USER'),
      password: this.configService.get('SHORTNER_DB_PASSWORD'),
      port: this.configService.get('SHORTNER_DB_PORT'),
      database: this.configService.get('SHORTNER_DB_NAME'),
      multipleStatements: false
    });

   
  }

  async linkShortnerQuery(sql: string, values?: any[], retries = 3): Promise<any[]> {
    let connectionAttempts = 0;

    const tryQuery = async (): Promise<any[]> => {
      try {
        if (!this.linkShortnerConnection) {
          await this.createConnectionToLinkShortner();
        }

        const [rows] = await this.linkShortnerConnection.query(sql, values);
        return rows;
      } catch (error) {
        // Log the error or handle it as needed
        console.error(`Query failed: ${error.message}`);

        // Close the existing connection to ensure a fresh one is created
        if (this.linkShortnerConnection) {
          await this.linkShortnerConnection.end();
          this.linkShortnerConnection = null;
        }

        if (++connectionAttempts < retries) {
          console.log(`Retrying query attempt ${connectionAttempts}`);
          return tryQuery();
        } else {
          throw error; // Throw the error if maximum retry attempts are reached
        }
      }
    };

    return tryQuery();
  }



  async findReportsOfAUser(userId, { limit = 10, page = 1 }, { startDate, endDate, excludeCurrentDay }: any) {
    const offset = (page - 1) * limit;
    let sql = '';
    let values = [];

    let countSql = `
      SELECT COUNT(DISTINCT DATE(timestamp)) AS totalCount
      FROM link_clicks
      WHERE short_url IN (SELECT short_url FROM short_links WHERE userId = ?)
    `;

    if (startDate && endDate) {
      const startDateObj = this.validateAndParseDate(startDate);
      const endDateObj = this.validateAndParseDate(endDate);

      if (!startDateObj || !endDateObj) {
        throw new Error('Invalid startDate or endDate');
      }

      sql = `
        SELECT DATE(timestamp) AS click_date, COUNT(*) AS click_count, SUM(earning) AS earning
        FROM link_clicks
        WHERE short_url IN (SELECT short_url FROM short_links WHERE userId = ?)
        AND DATE(timestamp) BETWEEN ? AND ?
        ${excludeCurrentDay ? "AND DATE(timestamp) <> CURDATE()" : ""}
        GROUP BY click_date
        ORDER BY click_date DESC
        LIMIT ? OFFSET ?
      `;

      countSql += ` AND DATE(timestamp) BETWEEN ? AND ? ${excludeCurrentDay ? "AND DATE(timestamp) <> CURDATE()" : ""}`;
      values = [userId, startDateObj.toISOString(), endDateObj.toISOString(), Number(limit), offset];
    } else {
      sql = `
        SELECT DATE(timestamp) AS click_date, COUNT(*) AS click_count, SUM(earning) AS earning
        FROM link_clicks
        WHERE short_url IN (SELECT short_url FROM short_links WHERE userId = ?)
        ${excludeCurrentDay ? "AND DATE(timestamp) <> CURDATE()" : ""}
        GROUP BY click_date
        ORDER BY click_date DESC
        LIMIT ? OFFSET ?
      `;

      values = [userId, Number(limit), offset];
    }

    const userReport = await this.linkShortnerQuery(sql, values);

    const totalCountRes = await this.linkShortnerQuery(countSql, values);
    return {
      results: userReport,
      totalCount: totalCountRes?.[0]?.totalCount,
      page,
      limit,
    };
  }


  // async findReportsOfAUser(userId, { limit = 10, page = 1 }, { startDate, endDate }: any) {
  //   const offset = (page - 1) * limit;
  //   let sql = '';
  //   let values = [];

  //   let countSql = `
  //     SELECT COUNT(DISTINCT DATE(timestamp)) AS totalCount
  //     FROM link_clicks
  //     WHERE short_url IN (SELECT short_url FROM short_links WHERE userId = ?)
  //   `;

  //   if (startDate && endDate) {
  //     const startDateObj = this.validateAndParseDate(startDate);
  //     const endDateObj = this.validateAndParseDate(endDate);

  //     if (!startDateObj || !endDateObj) {
  //       throw new Error('Invalid startDate or endDate');
  //     }

  //     sql = `
  //       SELECT DATE(timestamp) AS click_date, COUNT(*) AS click_count, SUM(earning) AS earning
  //       FROM link_clicks
  //       WHERE short_url IN (SELECT short_url FROM short_links WHERE userId = ?)
  //       AND DATE(timestamp) BETWEEN ? AND ?
  //       GROUP BY click_date
  //       ORDER BY click_date DESC
  //       LIMIT ? OFFSET ?
  //     `;

  //     countSql += ` AND DATE(timestamp) BETWEEN ? AND ?`;
  //     values = [userId, startDateObj.toISOString(), endDateObj.toISOString(), Number(limit), offset];
  //   } else {
  //     sql = `
  //       SELECT DATE(timestamp) AS click_date, COUNT(*) AS click_count, SUM(earning) AS earning
  //       FROM link_clicks
  //       WHERE short_url IN (SELECT short_url FROM short_links WHERE userId = ?)
  //       GROUP BY click_date
  //       ORDER BY click_date DESC
  //       LIMIT ? OFFSET ?
  //     `;

  //     values = [userId, Number(limit), offset];
  //   }

  //   const userReport = await this.linkShortnerQuery(sql, values);

  //   const totalCountRes = await this.linkShortnerQuery(countSql, values);
  //   return {
  //     results: userReport,
  //     totalCount: totalCountRes?.[0]?.totalCount,
  //     page,
  //     limit,
  //   };
  // }


  private validateAndParseDate(dateString: string): Date | null {
    const dateObj = new Date(dateString);
    return isNaN(dateObj.getTime()) ? null : dateObj;
  }



  async getDailyReports({ limit = 10, page = 1 }: PaginationDto, { startDate, endDate, search }: any) {
    const offset = (page - 1) * limit;
    let sql = '';
    let values = [];
    let countSql = '';
    let countSqlValues = [];
    let userFilterCondition = ''; // Add this line

    if (search) { // Check if search has more than three characters
      const users = await this.usersService.searchUsersByNameOrEmailOrId(search, {
        page: 1,
        limit: 20,
      });
      const userIds = users?.results?.map((user) => user.id);
      if (userIds && userIds.length > 0) {
        userFilterCondition = `AND short_links.userId IN (${userIds.join(', ')})`; // Adjust this line based on your schema
        // values.push(userIds); // Add userIds to values array
      }

    }


    if (startDate && endDate) {
      const startDateObj = this.validateAndParseDate(startDate);
      const endDateObj = this.validateAndParseDate(endDate);

      if (!startDateObj || !endDateObj) {
        throw new Error('Invalid startDate or endDate');
      }

      sql = `
            SELECT
              DATE(timestamp) AS click_date,
              short_links.userId AS user_id,
              short_links.username as email,
              COUNT(*) AS click_count,
              SUM(earning) AS earning
            FROM
              link_clicks
            JOIN
              short_links ON link_clicks.short_url = short_links.short_url
            WHERE
              DATE(timestamp) BETWEEN ? AND ? ${userFilterCondition}
            GROUP BY
              click_date, userId, email
            ORDER BY
              click_date DESC
            LIMIT
              ? OFFSET ?
        `;

      values = [...values, startDateObj.toISOString(), endDateObj.toISOString(), Number(limit), offset];


      countSql = `
      SELECT
        COUNT(*) AS totalCount
      FROM (
        SELECT
          short_links.userId,
          short_links.username as email,
          COUNT(DISTINCT CONCAT(DATE(timestamp), '-', short_links.userId, '-', short_links.username)) AS distinctCount
        FROM
          link_clicks
        JOIN
          short_links ON link_clicks.short_url = short_links.short_url
        WHERE
         DATE(timestamp) BETWEEN ? AND ? ${userFilterCondition}
        GROUP BY
          short_links.userId, short_links.username,  DATE(link_clicks.timestamp)
      ) AS subquery
        `;
      countSqlValues = [...values.slice(0, 2)];
    } else {
      sql = `
            SELECT
              DATE(timestamp) AS click_date,
              short_links.userId AS user_id,
              short_links.username as email,
              COUNT(*) AS click_count,
              SUM(earning) AS earning
            FROM
              link_clicks
            JOIN
              short_links ON link_clicks.short_url = short_links.short_url
            WHERE
             1=1  ${userFilterCondition}
            GROUP BY
              click_date, userId, email
            ORDER BY
              click_date DESC
            LIMIT
              ? OFFSET ?
        `;



      values = [...values, Number(limit), offset];

      countSql = `
      SELECT
        COUNT(*) AS totalCount
      FROM (
        SELECT
          short_links.userId,
          short_links.username as email,
          COUNT(DISTINCT CONCAT(DATE(timestamp), '-', short_links.userId, '-', short_links.username)) AS distinctCount
        FROM
          link_clicks
        JOIN
          short_links ON link_clicks.short_url = short_links.short_url
        WHERE
          1=1 ${userFilterCondition}
        GROUP BY
          short_links.userId, short_links.username,  DATE(link_clicks.timestamp)
      ) AS subquery
  `;


    }

    const reports = await this.linkShortnerQuery(sql, values);

    const totalCountRes = await this.linkShortnerQuery(countSql, countSqlValues);
    return {
      results: reports,
      totalCount: totalCountRes?.[0]?.totalCount,
      page,
      limit
    };
  }




  async getReports({ limit = 10, page = 1 }: PaginationDto, { startDate, endDate, search }: any) {

    const offset = (page - 1) * limit;
    let sql = '';
    let values = [];
    let userIdsCondition = '';

    if (search) {
      const users = await this.usersService.searchUsersByNameOrEmailOrId(search, {
        page: 1,
        limit: 1,
      });
      const userIds = users?.results?.map((user) => user.id);
      if (userIds && userIds.length > 0) {
        userIdsCondition = 'AND userId IN (?)'; // Adjust this line based on your schema
        values.push(userIds); // Add userIds to values array
      }
    }

    let countSql = `SELECT COUNT(DISTINCT short_url) as totalCount
        FROM short_links
        WHERE 1=1 ${userIdsCondition}`; // Add userIdsCondition here

    const countSqlValues = [...values]; // Copy values array

    if (startDate && endDate) {
      sql = `
            SELECT  *
            FROM short_links
            WHERE created_at BETWEEN ? AND ? ${userIdsCondition}
            ORDER BY revenue DESC
            LIMIT ? OFFSET ?
        `;
      values = [...values, startDate, endDate, Number(limit), offset];
      countSql += ' AND created_at BETWEEN ? AND ?';
      countSqlValues.push(startDate, endDate);
    } else {
      sql = `
            SELECT  *, username as email
            FROM short_links
            WHERE 1=1 ${userIdsCondition}
            ORDER BY revenue DESC
            LIMIT ? OFFSET ? 
        `;
      values = [...values, Number(limit), offset];
    }

    const earnings = await this.linkShortnerQuery(sql, values);

    const totalCountRes = await this.linkShortnerQuery(countSql, countSqlValues);

    return {
      results: earnings,
      totalCount: totalCountRes?.[0]?.totalCount,
      page,
      limit,
    };
  }

  async getWalletOfAUser(userId: number, { excludeCurrentDay }: any = {}) {
    const shortLinkSql = `SELECT * FROM short_links WHERE userId = ?`
    const shortLinks: any[] = await this.linkShortnerQuery(shortLinkSql, [userId]);
    const earningSql = `
        SELECT SUM(earning) as totalEarnings
        FROM link_clicks
        WHERE short_url = ?
        ${excludeCurrentDay ? "AND DATE(timestamp) <> CURDATE()" : ""}
    `;


    const earningData = await this.linkShortnerQuery(earningSql, [(shortLinks?.[0] as any)?.short_url]);


    const withdrawnTotal = await this.payoutRepository.sum('amount', { userId }) || 0;
    const totalEarnings = Number(earningData?.[0]?.totalEarnings || 0);
    const currentBalance = (totalEarnings - withdrawnTotal) || 0;

    return {
      totalEarnings,
      withdrawnTotal,
      currentBalance,
    };
  }


  // async getWalletOfAUser(userId: number) {
  //   const sql = `SELECT SUM(revenue) as totalEarnings FROM short_links WHERE userId = ?`
  //   const earningData = await this.linkShortnerQuery(sql, [userId]);
  //   const withdrawnTotal = await this.payoutRepository.sum('amount', {
  //     userId,
  //   }) || 0
  //   const totalEarnings = Number(earningData?.[0]?.totalEarnings || 0)
  //   const currentBalance = (totalEarnings - withdrawnTotal) || 0
  //   return {
  //     totalEarnings,
  //     withdrawnTotal,
  //     currentBalance
  //   }
  // }

  async getWallets({ page = 1, limit = 10 }: PaginationDto, { search }: any) {
    const offset = (page - 1) * limit;
    let sql = `
      SELECT
        userId, username as email,
        SUM(revenue) as totalEarnings
      FROM
        short_links
      WHERE
        userId IS NOT NULL
    `;
    const params = [];

    if (search) {
      const users = await this.usersService.searchUsersByNameOrEmailOrId(search, {
        page: 1,
        limit: 1,
      });
      const userIds = users?.results?.map((user) => user.id);

      if (userIds && userIds.length > 0) {
        sql += ' AND userId IN (?)'; // Adjust this line based on your schema
        params.push(userIds); // Add userIds to params array
      }
    }

    sql += `
      GROUP BY userId, username
      LIMIT ?
      OFFSET ?
    `;

    params.push(Number(limit), offset);

    const earningData = await this.linkShortnerQuery(sql, params);

    const walletData = [];
    for (const row of earningData) {
      const userId = row.userId;
      const totalEarnings = Number(row.totalEarnings || 0);

      const withdrawnTotal = await this.payoutRepository.sum('amount', {
        userId,
      }) || 0;

      const currentBalance = totalEarnings - withdrawnTotal;

      walletData.push({
        userId,
        email: row.email,
        totalEarnings,
        withdrawnTotal,
        currentBalance,
      });
    }

    const countSql = `
      SELECT COUNT(DISTINCT userId) as totalCount
      FROM
        short_links
    `;

    const totalCountRes = await this.linkShortnerQuery(countSql);

    return {
      results: walletData,
      totalCount: totalCountRes?.[0]?.totalCount,
      page,
      limit,
    };
  }

  async createShortLink(userId, courseId?) {
    const shortUrlExist = await this.linkShortnerQuery("SELECT short_url FROM short_links WHERE userId = ?", [userId])

    if (shortUrlExist?.length) {
      throw new BadRequestException("The user already have shortlink")
    }
    const user = await this.usersService.findOne(userId)
    const shortUrl = customAlphabet(urlAlphabet, 64)
    const params = [userId, shortUrl().toLocaleLowerCase(), this.configService.get('SHORTNER_MOTHER_LINK'), courseId, user.email]
    await this.linkShortnerQuery(`INSERT INTO short_links (userId, short_url, original_url, courseId, userName) VALUES (?, ?, ?, ?, ?)`, params)
    this.eventEmitter.emit('smartLink.generated', {
      userId
    })

    return {
      success: true
    }


  }
  
  async createShortLinksForAllStudentsOfACourse(courseId) {
    const batchSize = 100; // Set your desired batch size
    const concurrencyLimit = 10; // Set the maximum number of concurrent queries
  
    let enrollments = await this.enrollmentRepository.createQueryBuilder("enrollment")
      .select([
        "enrollment.id",
        "user.id",
        "user.email",
      ])
      .where("enrollment.courseId = :courseId", { courseId })
      .leftJoin("enrollment.user", "user")
      .getMany();
  
    if (!enrollments.length) {
      throw new NotFoundException("No enrollments found for the given course");
    }
  
    const chunks = [];
  
    for (let i = 0; i < enrollments.length; i += batchSize) {
      const chunk = enrollments.slice(i, i + batchSize);
      chunks.push(chunk);
    }
  
    const processChunk = async (chunk) => {
      const values = chunk.map((enroll) => {
        const shortUrl = customAlphabet(urlAlphabet, 64);
        return [
          enroll?.user?.id,
          this.configService.get('URL_SHORTNER_BASEURL') + shortUrl().toLocaleLowerCase(),
          this.configService.get('SHORTNER_MOTHER_LINK'),
          courseId,
          enroll?.user?.email
        ];
      });
  
      const placeholders = Array.from({ length: chunk.length }, (_, index) => `(?, ?, ?, ?, ?)`).join(', ');
      const query = `INSERT INTO short_links (userId, short_url, original_url, courseId, userName) VALUES ${placeholders}`;
  
      await this.linkShortnerQuery(query, values.flat());
    };
  
    // Sequentially process chunks with limited concurrency
    const chunkPromises = [];
    let index = 0;
  
    const processNextChunk = async () => {
      if (index < chunks.length) {
        const chunk = chunks[index];
        index++;
        return processChunk(chunk).then(processNextChunk);
      }
    };
  
    // Start the initial batch of promises with limited concurrency
    for (let i = 0; i < concurrencyLimit; i++) {
      chunkPromises.push(processNextChunk());
    }
  
    // Wait for all promises to resolve
    await Promise.all(chunkPromises);
  
    return {
      success: true
    };
  }
  
  
  
  

  async getShortLinkOfAUser(userId) {
    const urlShortnerBaseUrl = this.configService.get('URL_SHORTNER_BASEURL')
    const shortUrls = await this.linkShortnerQuery(`SELECT id, short_url as url, status, clicks, revenue FROM short_links WHERE userId = ?`, [userId])

    return shortUrls.map(item => ({ ...item, url: `${urlShortnerBaseUrl}${item.url}` }))
  }

  async updateShortUrlStatus(id, status) {

    this.eventEmitter.emit(`smartLink.${status}`, {
      userId: id
    })
    
    return await this.linkShortnerQuery(`UPDATE short_links SET status = ? WHERE id = ?`, [status, id])
  }


  async createPayoutRequest(user, createPayoutRequestDto: CreatePayoutRequestDto) {
    // check for belence 
    const userId = user.sub
    const userWallet = await this.getWalletOfAUser(userId, { excludeCurrentDay: true })
    const currentBalance = userWallet.currentBalance || 0;
    if (currentBalance < createPayoutRequestDto.amount) {
      throw new BadRequestException("আপনার পর্যাপ্ত ব্যালেন্স নেই")
    }
    const currentDate = new Date(); // Get the current date
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59, 999);

    const payoutRequestOfThisMonth = await this.payoutRepository
      .createQueryBuilder('payout')
      .where('payout.userId = :userId', { userId })
      .andWhere('payout.createdAt >= :firstDayOfMonth', { firstDayOfMonth })
      .andWhere('payout.createdAt <= :lastDayOfMonth', { lastDayOfMonth })
      .getCount();


    if (payoutRequestOfThisMonth >= 4) {
      throw new BadRequestException('দুঃখিত, আপনি এক মাসে 4 বারের বেশি টাকা তুলতে পারবেন না')
    }
    this.eventEmitter.emit('payouts.requested', {
      fullName: user.fullName,
      email: user.email,
      amount: createPayoutRequestDto.amount
    })

    return this.payoutRepository.insert({
      userId,
      ...createPayoutRequestDto
    })
  }



  async updatePayoutStatus(actionTaker, id, status, sendMail?) {
    const payoutRequest = await this.payoutRepository.findOne({
      where: {
        id
      },
      relations: {
        user: true
      }
    })
    payoutRequest.status = status;
    payoutRequest.actionTaker = actionTaker;
    await this.payoutRepository.save(payoutRequest)

    if (status === PayoutStatus.PAID) {
      this.eventEmitter.emit('payouts.paid', {
        userId: payoutRequest.userId,
        amount: payoutRequest.amount,
        user: payoutRequest.user,
        accountNumber: payoutRequest.accountNumber,
        paymentMethod: payoutRequest.payoutMethod
      })
    } else if (status === PayoutStatus.REJECTED) {
      this.eventEmitter.emit('payouts.rejected', {
        userId: payoutRequest.userId,
        user: payoutRequest.user,
        accountNumber: payoutRequest.accountNumber,
        amount: payoutRequest.amount,
        paymentMethod: payoutRequest.payoutMethod,
        reason: payoutRequest.reviewerMessage
      })
    }


    return {
      success: true
    }
  }

  async updateReviewStatus(reviewerId, id, reviewerMessage, reject?) {

    const payoutRequest = await this.payoutRepository.findOne({
      where: {
        id
      },
      relations: {
        user: true
      }
    })

    payoutRequest.reviewerId = reviewerId
    payoutRequest.isReviewed = true

    payoutRequest.reviewerMessage = reviewerMessage

    if (reject) {
      payoutRequest.status = PayoutStatus.REJECTED
      payoutRequest.actionTaker = reviewerId



      this.eventEmitter.emit('payouts.rejected', {
        accountNumber: payoutRequest.accountNumber,
        user: payoutRequest.user,
        userId: payoutRequest.userId,
        amount: payoutRequest.amount,
        paymentMethod: payoutRequest.payoutMethod
      })
    } else {
      payoutRequest.status = PayoutStatus.APPROVED
      this.eventEmitter.emit('payouts.approved', {
        accountNumber: payoutRequest.accountNumber,
        user: payoutRequest.user,
        userId: payoutRequest.userId,
        amount: payoutRequest.amount,
        paymentMethod: payoutRequest.payoutMethod
      })

    }

    await this.payoutRepository.save(payoutRequest)

    return {
      success: true
    }
  }


  async getPayoutOfAUser(userId, { limit = 10, page = 1 }: PaginationDto, { startDate, endDate }: any) {
    const skip = (page - 1) * limit
    const query: any = {
      userId
    }
    if (startDate) {
      query.createdAt = MoreThanOrEqual(startDate);
    }

    if (endDate) {
      if (!query.createdAt) {
        query.createdAt = MoreThanOrEqual(endDate);
      } else {
        query.createdAt = Between(startDate, endDate);
      }
    }

    const [payouts, totalCount] = await this.payoutRepository.findAndCount({
      where: query,
      order: {
        id: 'DESC'
      },
      skip,
      take: limit
    })

    return {
      results: payouts,
      totalCount,
      page,
      limit
    }

  }

  async getPayouts({ limit = 10, page = 1 }: PaginationDto, { startDate, endDate, status, isReviewed, search }: any) {
    const skip = (page - 1) * limit
    const query: any = {

    }

    if (search) {
      query.user = {};
      if (Number(search) && !search?.startsWith('0')) {
        query.user.id = search
      } else {
        query.user = [
          { fullName: Like(`%${search}%`) },
          { email: Like(`%${search}%`) },
          { mobileNumber: Like(`%${search}%`) },

        ];
      }

    }

    if (status) {
      query.status = In([status])
    }
    if (isReviewed) {
      query.isReviewed = isReviewed == 'true'
    }

    if (startDate) {
      query.createdAt = MoreThanOrEqual(startDate);
    }

    if (endDate) {
      if (!query.createdAt) {
        query.createdAt = MoreThanOrEqual(endDate);
      } else {
        query.createdAt = Between(startDate, endDate);
      }
    }

    const [payouts, totalCount] = await this.payoutRepository.findAndCount({
      where: query,
      order: {
        id: 'DESC'
      },
      skip,
      take: limit,
      relations: {
        user: true,

      },
    })

    return {
      results: payouts?.map((data: any) => {
        data.user = {
          fullName: data.user?.fullName,
          email: data.user.email,
          id: data.user.id,
        }
        return data
      }),
      totalCount,
      page,
      limit
    }
  }


  async getStatisticsForTimePeriod({ timePeriod, specificMonth, startDate: _startDate, endDate: _endDate }) {
    const currentDate = moment();
    let startDate: Date;
    let endDate: Date;

    if (_startDate) {
      startDate = moment(_startDate).startOf('d').toDate()
    }

    if (_endDate) {
      startDate = moment(endDate).startOf('d').toDate()
    }

    // const timeZoneOffset = '+06:00'; // Adjust this according to your desired time zone offset

    switch (timePeriod) {
      case 'today':
        startDate = currentDate.startOf('day').toDate();
        endDate = currentDate.endOf('day').toDate();
        break;
      case 'thisWeek':
        startDate = currentDate.startOf('week').toDate();
        endDate = currentDate.endOf('week').toDate();
        break;
      case 'thisMonth':
        startDate = currentDate.startOf('month').toDate();
        endDate = currentDate.endOf('month').toDate();
        break;
      case 'lastMonth':
        startDate = currentDate.subtract(1, 'months').startOf('month').toDate();
        endDate = currentDate.add(1, 'month').endOf('month').toDate();
        break;
      case 'specificMonth':
        const specificMonthDate = moment(specificMonth);
        if (!specificMonthDate.isValid()) {
          throw new Error('Invalid specificMonth date');
        }
        startDate = specificMonthDate.startOf('month').toDate();
        endDate = specificMonthDate.endOf('month').toDate();
        break;
      default:
        throw new Error('Invalid time period');
    }

    const statistics = await this.payoutRepository
      .createQueryBuilder('payout')
      .select('SUM(payout.amount)', 'totalAmount')
      .addSelect('COUNT(payout.id)', 'totalCount')
      .addSelect('SUM(CASE WHEN payout.status = :paidStatus THEN payout.amount ELSE 0 END)', 'paidAmount')
      .addSelect('COUNT(CASE WHEN payout.status = :paidStatus THEN 1 END)', 'paidCount')
      .addSelect('SUM(CASE WHEN payout.status = :waitingForPaymentStatus THEN payout.amount ELSE 0 END)', 'waitingForPaymentAmount')
      .addSelect('COUNT(CASE WHEN payout.status = :waitingForPaymentStatus THEN 1 END)', 'waitingForPaymentCount')
      .addSelect('SUM(CASE WHEN payout.status = :underReviewStatus THEN payout.amount ELSE 0 END)', 'underReviewAmount')
      .addSelect('COUNT(CASE WHEN payout.status = :underReviewStatus THEN 1 END)', 'underReviewCount')
      .andWhere('payout.updatedAt BETWEEN :startDate AND :endDate')
      // .andWhere(`DATE_FORMAT(CONVERT_TZ(payout.createdAt, '+00:00', '${timeZoneOffset}'), '%Y-%m') = DATE_FORMAT(CONVERT_TZ(NOW(), '+00:00', '${timeZoneOffset}'), '%Y-%m')`)
      .setParameters({
        paidStatus: PayoutStatus.PAID,
        waitingForPaymentStatus: PayoutStatus.APPROVED,
        underReviewStatus: PayoutStatus.PENDING,
        startDate,
        endDate,
      })
      .getRawOne();

    return {
      totalAmount: statistics.totalAmount || 0,
      totalCount: statistics.totalCount || 0,
      paidAmount: statistics.paidAmount || 0,
      paidCount: statistics.paidCount || 0,
      waitingForPaymentAmount: statistics.waitingForPaymentAmount || 0,
      waitingForPaymentCount: statistics.waitingForPaymentCount || 0,
      underReviewAmount: statistics.underReviewAmount || 0,
      underReviewCount: statistics.underReviewCount || 0,
    };
  }



  async getPayoutStats(query) {

    const underReviewCount = await this.payoutRepository.countBy({
      isReviewed: false
    })



    const underReviewAmount = await this.payoutRepository.sum('amount', {
      isReviewed: false
    }) || 0

    const waitingForPaymentCount = await this.payoutRepository.countBy({
      status: PayoutStatus.APPROVED,
      isReviewed: true,
    })

    const waitingForPaymentAmount = await this.payoutRepository.sum('amount', {
      status: PayoutStatus.APPROVED,
      isReviewed: true,
    }) || 0

    const paidCount = await this.payoutRepository.countBy({
      status: PayoutStatus.PAID
    })

    const paidAmount = await this.payoutRepository.sum('amount', {
      status: PayoutStatus.PAID
    }) || 0;
    const rejectedCount = await this.payoutRepository.countBy({
      status: PayoutStatus.REJECTED
    })

    const rejectedAmount = await this.payoutRepository.sum('amount', {
      status: PayoutStatus.REJECTED
    }) || 0;
    const result: any = {
      paidAmount,
      paidCount,
      rejectedCount,
      rejectedAmount,
      waitingForPaymentAmount,
      waitingForPaymentCount,
      underReviewAmount,
      underReviewCount,
      statsOfSelectedTimePeriod: {

      }
    }

    result.statsOfSelectedTimePeriod = {

    }
    if (query?.timePeriod) {
      result.statsOfSelectedTimePeriod.selectedTimePeriod = query?.timePeriod
      result.statsOfSelectedTimePeriod = await this.getStatisticsForTimePeriod(query)

    }
    return result
  }

  async getDailyClickSpikes(_startDate = getDateBefore(15), _endDate: Date = new Date()) {
    try {

      const startDate = moment(_startDate).tz('Asia/Dhaka').startOf('day').toDate()
      const endDate = moment(_endDate).tz('Asia/Dhaka').endOf('day').toDate()
      const sql = `SELECT 
              DATE_FORMAT(CONVERT_TZ(link_clicks.timestamp, '+00:00', '+06:00'), '%Y-%m-%d') as clickDate,
              COUNT(link_clicks.id) as clickCount
          FROM 
              link_clicks
          WHERE 
              link_clicks.timestamp BETWEEN ? AND ?
          GROUP BY 
              clickDate
          ORDER BY 
              clickDate ASC

      `
      const params = [startDate, endDate]
      const earningData = await this.linkShortnerQuery(sql, params);

      const totalEarningQuery = `SELECT 
            SUM(earning) as totalEarning,
            COUNT(*) as totalClickCount
        FROM 
            link_clicks
      `
      const totalEarningResult = await this.linkShortnerQuery(totalEarningQuery, []);

      const earningOfCurrentMonthQuery = `SELECT 
        COUNT(link_clicks.id) as totalClickCount, 
        SUM(link_clicks.earning) as totalEarning

        FROM 
            link_clicks
        WHERE 
            DATE_FORMAT(CONVERT_TZ(link_clicks.timestamp, '+00:00', '+06:00'), '%Y-%m') = DATE_FORMAT(CONVERT_TZ(NOW(), '+00:00', '+06:00'), '%Y-%m');
      `
      const currentMonthResult = await this.linkShortnerQuery(earningOfCurrentMonthQuery, []);


      // Generate a list of dates between startDate and endDate
      const dateList = generateDateList(startDate, endDate);

      // Convert enrollmentData to a map for efficient lookups
      const earningDataMap = earningData.reduce((map, entry) => {
        map[entry.clickDate] = entry;
        return map;
      }, {});

      // Fill in missing dates with 0 enrollment count
      const result = dateList.map((date) => ({
        clickDate: date,
        clickCount: Number(earningDataMap[date]?.clickCount) || 0,
      }));

      return {
        results: result, currentMonth: {
          ...currentMonthResult[0]
        }, ...totalEarningResult[0]
      };

    } catch (error) {
      throw new Error(`Error fetching daily click spikes: ${error.message}`);
    }
  }


  async insertExtraClicks(shortUrl, clickCount) {
    // Query to fetch earning_per_click from settings
    const sqlEarningPerClick = 'SELECT earning_per_click FROM settings';
    const earningPerClickResult = await this.linkShortnerQuery(sqlEarningPerClick, []);
    const earningPerClick = earningPerClickResult[0]?.earning_per_click;

    // Define the batch size
    const batchSize = 100;

    // Calculate the number of batches
    const numBatches = Math.ceil(clickCount / batchSize);

    // Process the data in batches
    for (let batchIndex = 0; batchIndex < numBatches; batchIndex++) {
      const startIdx = batchIndex * batchSize;
      const endIdx = Math.min((batchIndex + 1) * batchSize, clickCount);

      const batchData = [];
      for (let i = startIdx; i < endIdx; i++) {
        batchData.push({ ip_address: "0.0.0.0", earningPerClick, shortUrl });
      }

      // Use parameterized queries to prevent SQL injection
      const valuesClause = batchData.map(() => '(?, ?, ?)').join(', ');
      const valuesParams = batchData.flatMap(data => [data.ip_address, data.earningPerClick, data.shortUrl]);

      const sql = `INSERT INTO link_clicks (ip_address, earning, short_url) VALUES ${valuesClause}`;

      await this.linkShortnerQuery(sql, valuesParams);
    }

    // Update short link revenue balance
    const updateSql = 'UPDATE short_links SET clicks = clicks + ?, revenue = revenue + ? WHERE short_url = ?';
    const updateParams = [Number(clickCount), Number(earningPerClick * clickCount), shortUrl];

    return await this.linkShortnerQuery(updateSql, updateParams);
  }


  @OnEvent('smartLink.generated')
  async handleCourseAccessGiven(payload: any) {

    return this.notificationGateway.sendInstantNotification({
      receiverType: NotificationReceiver.INDIVIDUAL_USERS,
      receivers: [payload.userId],
      message: `অভিনন্দন, আপনার ব্যাক্তিগত স্মার্টলিংকটি তৈরি হয়েছে `
    })
  }

  @OnEvent('smartLink.blocked')
  async handleSmartLinkBlockNotification(payload: any) {

    await this.notificationGateway.sendInstantNotification({
      receiverType: NotificationReceiver.INDIVIDUAL_USERS,
      receivers: [payload.userId],
      message: `আপনার স্মার্টলিঙ্কটি মার্কেটপ্লেস কর্তৃক ব্লক করা  হয়েছে`,
      body: payload.reason,
      linkOrId: '/dashboard/wallet'
    })

  }

  @OnEvent('smartLink.active')
  async handleSmartLinkActiveNotification(payload: any) {

    await this.notificationGateway.sendInstantNotification({
      receiverType: NotificationReceiver.INDIVIDUAL_USERS,
      receivers: [payload.userId],
      message: `আপনার ব্লকড স্মার্টলিঙ্কটি আনব্লক করা হয়েছে`,
      body: payload.reason,
      linkOrId: '/dashboard/wallet'
    })

  }

  @OnEvent('payouts.requested')
  async handleRequestedPayoutNotification(payload: any) {
    try {
      await this.notificationGateway.sendInstantNotification({
        notificationType: NotificationType.ADMIN_NOTIFICATION,
        receiverType: NotificationReceiver.PENDING_WITHDRAW_UPDATES_ADMIN_RECEIVER,
        receivers: [],
        linkOrId: `/admin/payouts/under-reviews?search=${payload.email}`,
        message: `"${payload.email}" requested a withdrawal of $${payload.amount}, pending for approval
        `
      })
    } catch (error) {
      this.logger.error("Payout request notification error", error)
    }

  }
  @OnEvent('payouts.approved')
  async handleApprovedNotification(payload: any) {
    try {
      await this.notificationGateway.sendInstantNotification({
        receiverType: NotificationReceiver.INDIVIDUAL_USERS,
        receivers: [payload.userId],
        linkOrId: `/dashboard/wallet`,
        message: `আপনার $${payload.amount} উইথড্র রিকোয়েস্টটি এপ্রুভ করা হয়েছে, খুব শীঘ্রই  সমপরিমাণ টাকা আপনার ${payload.paymentMethod} একাউন্টে ট্রান্সফার করা হবে`
      })

      await this.notificationGateway.sendInstantNotification({
        notificationType: NotificationType.ADMIN_NOTIFICATION,
        receiverType: NotificationReceiver.AWAITING_WITHDRAW_UPDATES_ADMIN_RECEIVER,
        receivers: [],
        linkOrId: `/admin/payouts/pending?search=${payload?.user?.email}`,

        message: `A withdrawal request of $${payload.amount} has been approved and  awaiting for payment
        `
      })

      await this.mailService.sendPayoutApprovedMail({
        user: payload.user,
        amount: payload.amount,
        payoutMethod: payload.paymentMethod,
        accountNumber: payload.accountNumber,

      })
    } catch (error) {
      this.logger.error("Payout request notification error", error)

    }

  }


  @OnEvent('payouts.paid')
  async handlePaidNotification(payload: any) {


    await this.notificationGateway.sendInstantNotification({
      receiverType: NotificationReceiver.INDIVIDUAL_USERS,
      receivers: [payload.userId],
      linkOrId: `/dashboard/wallet`,

      message: `আপনার  উইথড্র $${payload.amount} এর সমপরিমাণ টাকা  আপনার ${payload.paymentMethod} একাউন্টে ট্রান্সফার করা হয়েছে`
    })

    await this.mailService.sendPayoutPaidMail({
      user: payload.user,
      amount: payload.amount,
      payoutMethod: payload.paymentMethod,
      accountNumber: payload.accountNumber,

    })
  }

  @OnEvent('payouts.rejected')
  async handleRejectNotification(payload: any) {


    await this.notificationGateway.sendInstantNotification({
      receiverType: NotificationReceiver.INDIVIDUAL_USERS,
      receivers: [payload.userId],
      message: `আপনার $${payload.amount} উইথড্র রিকোয়েস্ট প্রত্যাখ্যান করা হয়েছে`,
      body: payload.reason,
      linkOrId: '/dashboard/wallet'
    })

    await this.mailService.sendPayoutRejectionMail({
      user: payload.user,
      amount: payload.amount,
      reviewerMessage: payload.reason
    })
  }
}
