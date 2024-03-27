import { User } from 'src/users/entities/user.entity';
import { FEATURE_ROLE_MAP_CACHE_KEY, USER_FEATURE_MAP_PREFIX } from './contants/access-control.const';
import { UpdateFeatureDto } from './dto/update-access-control.dto';
import { FeatureUserMap } from './entities/feature-user-map.entity';
import { AddToFeatureCatalogDto } from './dto/add-to-feature-catalog.dto';
import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FeatureCatalog } from './entities/feature-catalog.entity';
import { FeatureRoleMap } from './entities/feature-role-map.entity';
import { ROLE } from 'src/users/enums/user.enums';
import { Feature } from './entities/feature.entity';
// import { AddFeatureDto } from './dto/add-feature.dto';
// import { AddToFeatureRoleMapDto } from './dto/add-to-feature-role-map.dto';
import { AddToFeatureUserMapDto } from './dto/add-to-feature-user-map.dto';
import { UpdateFeatureUserMapDto } from './dto/update-feature-user-map.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager'
import { Cache } from 'cache-manager'
import { FEATURES } from './contants/features.constants';
import { FEATURE_ROLE_MAP } from './contants/feature-role-map.constants';
import { promisify } from 'util';
import { RedisClient } from 'redis';

@Injectable()
export class AccessControlService {
  private redisClient: RedisClient;
  private readonly logger = new Logger(AccessControlService.name);

  constructor(
    @InjectRepository(FeatureRoleMap) private featureRoleMapRepository: Repository<FeatureRoleMap>,
    @InjectRepository(FeatureCatalog) private featureCatalogRepository: Repository<FeatureCatalog>,
    @InjectRepository(FeatureUserMap) private featureUserMapRepository: Repository<FeatureUserMap>,
    @InjectRepository(Feature) private featureRepository: Repository<Feature>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @InjectRepository(User) private userRepository: Repository<User>,
  ) {
    this.redisClient = this.cacheManager.store.getClient();

  }

  // async addFeature(addFeatureDto: AddFeatureDto) {
  //   return await this.featureRepository.insert(addFeatureDto)

  // }
  private promisifiedExpire(key: string, ttlInSeconds: number): Promise<void> {
    return new Promise((resolve, reject) => {
      this.redisClient.expire(key, ttlInSeconds, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }

  async redisHsetAsync(key, field, value, ttlInSeconds) {
    const hsetAsync = promisify(this.redisClient.hset).bind(this.redisClient);

    try {
      const valueAsString = JSON.stringify(value);

      await hsetAsync(key, field, valueAsString);

      if (ttlInSeconds) {
        await this.promisifiedExpire(key, ttlInSeconds);
      }

    } catch (error) {
      console.error('Error:', error);
      throw error;
    }
  }


  async redisHgetAsync(key, field) {
    const hgetAsync = promisify(this.redisClient.hget).bind(this.redisClient);
    return JSON.parse(await hgetAsync(key, field));
  }

  async redisHdelAsync(key, field) {
    const hdelAsync = promisify(this.redisClient.hdel).bind(this.redisClient);

    try {
      await hdelAsync(key, field);
    } catch (error) {
      throw error;
    }
  }



  findAllFeatures() {
    // return this.featureRepository.find()
    return Object.values(FEATURES)
  }

  // async addFeatureToCatalog(addToFeatureCatalogDto: AddToFeatureCatalogDto) {
  //   const theFeature = await this.featureRepository.findOne({
  //     where: {
  //       id: addToFeatureCatalogDto.featureId
  //     }
  //   })
  //   if(!theFeature) {
  //     throw new NotFoundException('The feature does not exists')
  //   }

  //   return this.featureCatalogRepository.insert(addToFeatureCatalogDto)
  // }

  // async addToFeatureRoleMap(addToFeatureRoleMapDto: AddToFeatureRoleMapDto) {

  //   const theFeature = await this.featureRepository.findOne({
  //     where: {
  //       id: addToFeatureRoleMapDto.featureId
  //     }
  //   })
  //   if(!theFeature) {
  //     throw new NotFoundException('The feature does not exists')
  //   }
  //   try {
  //     await this.cacheManager.del(FEATURE_ROLE_MAP_CACHE_KEY)
  //   } catch (error) {

  //   }
  //   return this.featureRoleMapRepository.insert(addToFeatureRoleMapDto)
  // }

  async addToFeatureUserMap(addToFeatureUserMapDto: AddToFeatureUserMapDto) {
    const theFeature = FEATURES[addToFeatureUserMapDto.featureId]
    if (!theFeature) {
      throw new NotFoundException('The feature does not exists')
    }
    try {
      await this.redisHdelAsync(USER_FEATURE_MAP_PREFIX, addToFeatureUserMapDto.userId)
    } catch (error) {

    }
    return this.featureUserMapRepository.insert(addToFeatureUserMapDto)
  }

  // ...

  async updateToFeatureUserMap(updateFeatureUserMapDto: UpdateFeatureUserMapDto) {
    const { userId, featureIds } = updateFeatureUserMapDto;
    await this.featureUserMapRepository.delete({
      userId,
    });

    const featuresToInsert = featureIds
      .map(featureId => FEATURES[featureId])
      .filter(Boolean)
      .map(feature => ({
        featureId: feature.id, // Assuming 'id' is the property representing the featureId in FEATURES
        userId: updateFeatureUserMapDto.userId,
      }));

    const batchSize = 100; // You can adjust the batch size based on your requirements
    const featureChunks = this.chunkArray(featuresToInsert, batchSize);

    const insertPromises = featureChunks.map(chunk => {
      if (chunk.length > 0) {
        return this.insertFeatureUserMap(chunk);
      }
      return Promise.resolve(); // Resolve with an empty promise if the chunk is empty
    });

    await Promise.allSettled(insertPromises);

    try {
      await this.redisHdelAsync(USER_FEATURE_MAP_PREFIX, userId);
    } catch (error) {
      // Handle the error if necessary
    }

    return { success: true };
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    return Array.from({ length: Math.ceil(array.length / size) }, (_, index) =>
      array.slice(index * size, (index + 1) * size)
    );
  }

  private async insertFeatureUserMap(data: any[]) {
    return this.featureUserMapRepository
      .createQueryBuilder()
      .insert()
      .into('featureUserMap') // Replace 'feature_user_map' with your actual table name
      .values(data)
      .execute();
  }


  async removeFeatureUserMap(userId, featureId) {
    const theFeature = await this.featureRepository.findOne({
      where: {
        id: featureId
      }
    })
    if (!theFeature) {
      throw new NotFoundException('The feature does not exists')
    }
    try {
      await this.redisHdelAsync(USER_FEATURE_MAP_PREFIX, userId)
    } catch (error) {

    }

    return this.featureUserMapRepository.delete({
      featureId,
      userId
    })
  }

  findRoleAccessibleFeatures(role: ROLE): any[] {
    return Object.values(FEATURE_ROLE_MAP[role] || [])

  }


  findUserAccessibleFeatures(userId) {
    return this.featureUserMapRepository.find({
      where: {
        userId
      }
    })
  }

  findCatalogByRole(role?) {
    const query: Record<string, any> = {}
    if (role && role != -1) {
      query.role = role
    }
    return this.featureCatalogRepository.find(query)
  }



  // async updateFeature(id: number, updateFeatureDto: UpdateFeatureDto) {
  //   const data = await this.featureRepository.update(id, updateFeatureDto)
  //   try {
  //     await this.cacheManager.del(FEATURE_ROLE_MAP_CACHE_KEY)
  //   } catch (error) {

  //   }
  //   return data

  // }

  async findMyFeatures(user): Promise<any> {
    try {

      const dataFromCache = await this.redisHgetAsync(USER_FEATURE_MAP_PREFIX, user.sub || user.id)

      if (dataFromCache) {
        return dataFromCache
      }
    } catch (error) {
    }

    const featuresByRole = await this.findRoleAccessibleFeatures(user?.role)
    const featuresByUser = await this.findUserAccessibleFeatures(user?.sub || user.id)
    const combinedAccess = [...featuresByRole, ...featuresByUser.map((access) => FEATURES[access.featureId])]

    await this.redisHsetAsync(USER_FEATURE_MAP_PREFIX, user.sub || user.id, combinedAccess, 3600 * 24)

    return combinedAccess
  }

  async findAllFeaturesByUserId(id) {
    const user = await this.userRepository.findOne({ where: { id } })
    if (!user) {
      return new NotFoundException('User not found!')
    }
    return this.findMyFeatures(user)
  }

  formatMyFeatures(data) {
    const map = {};

    data.forEach(({ feature }) => {
      const { frontendSectionGroup, name, frontendUrl, parent } = feature;

      if (!map[frontendSectionGroup]) {
        map[frontendSectionGroup] = [];
      }

      if (parent === 0) {
        map[frontendSectionGroup].push({ name, url: frontendUrl });
      } else {
        const mainFeature = map[frontendSectionGroup][0];
        if (!mainFeature.childFeatures) {
          mainFeature.childFeatures = [];
        }
        mainFeature.childFeatures.push({ name, url: frontendUrl });
      }
    });

    return map;
  }

  async checkApiAccess(req) {
    const endpoint = req.route.path;

    const HTTPMethod = req.method?.toLowerCase();
    const featuresByRole = this.findRoleAccessibleFeatures(req.user.role)

    const hasAccessByRole = featuresByRole.find(feature => endpoint == feature.endpoint && feature.HTTPMethod == HTTPMethod)

    if (hasAccessByRole) {
      return true
    }

    const featuresOfUser = await this.findUserAccessibleFeatures(req.user.sub)


    const hasAccess = featuresOfUser.find((access) => {
      const feature = FEATURES[access.featureId]

      return (endpoint == feature.endpoint && feature.HTTPMethod == HTTPMethod)

    })

    if(!hasAccess) {
      if(HTTPMethod !== 'get') {
        this.logger.error(`Unauthorized feature access attempt "${endpoint}" by method "${HTTPMethod}" , userId: ${req.user?.sub} `)
      }
      
    }

    return hasAccess


  }

}
