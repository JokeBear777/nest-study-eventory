import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ReviewRepository } from './review.repository';
import { CreateReviewPayload } from './payload/create-review.payload';
import { ReviewDto, ReviewListDto } from './dto/review.dto';
import { CreateReviewData } from './type/create-review-data.type';
import { ReviewQuery } from './query/review.query';
import { UpdateReviewData } from './type/update-review-data.type';
import { PutUpdateReviewPayload } from './payload/put-update-review.payload';
import { PatchUpdateReviewPayload } from './payload/patch-update-review.payload';
import { UserBaseInfo } from '../auth/type/user-base-info.type';
import { ReviewData } from './type/review-data.type';

@Injectable()
export class ReviewService {
  constructor(private readonly reviewRepository: ReviewRepository) {}

  async createReview(
    payload: CreateReviewPayload,
    user: UserBaseInfo,
  ): Promise<ReviewDto> {
    const isReviewExist = await this.reviewRepository.isReviewExist(
      user.id,
      payload.eventId,
    );
    if (isReviewExist) {
      throw new ConflictException('해당 유저의 리뷰가 이미 존재합니다.');
    }

    const isUserJoinedEvent = await this.reviewRepository.isUserJoinedEvent(
      user.id,
      payload.eventId,
    );
    if (!isUserJoinedEvent) {
      throw new ConflictException('해당 유저가 이벤트에 참가하지 않았습니다.');
    }

    const event = await this.reviewRepository.getEventById(payload.eventId);
    if (!event) {
      throw new NotFoundException('Event가 존재하지 않습니다.');
    }

    if (event.endTime > new Date()) {
      throw new ConflictException(
        'Event가 종료되지 않았습니다. 아직 리뷰를 작성할 수 없습니다.',
      );
    }

    if (event.hostId === user.id) {
      throw new ConflictException(
        '자신이 주최한 이벤트에는 리뷰를 작성 할 수 없습니다.',
      );
    }

    const createData: CreateReviewData = {
      userId: user.id,
      eventId: payload.eventId,
      score: payload.score,
      title: payload.title,
      description: payload.description,
    };

    const review = await this.reviewRepository.createReview(createData);

    return ReviewDto.from(review);
  }

  async getReviewById(
    reviewId: number,
    user: UserBaseInfo,
  ): Promise<ReviewDto> {
    const review = await this.reviewRepository.getReviewById(reviewId);

    if (!review) {
      throw new NotFoundException('Review가 존재하지 않습니다.');
    }

    const event = await this.reviewRepository.getEventById(review.eventId);
    if (event?.clubId !== null && event?.isArchived === true) {
      const isEventJoin = await this.reviewRepository.isUserJoinedEvent(
        user.id,
        event.id,
      );
      if (!isEventJoin) {
        throw new ForbiddenException(
          '삭제된 클럽의 클럽모임 리뷰는 참여자만 조회할 수 있습니다.',
        );
      }
    }

    if (event?.clubId !== null) {
      if (event?.clubId === undefined) {
        throw new InternalServerErrorException('서버 오류.');
      }
      const isUserClubMember = await this.reviewRepository.isClubMember(
        event.clubId,
        user.id,
      );

      if (!isUserClubMember) {
        throw new ForbiddenException(
          '클럽 모임 리뷰는 클럽원만 조회할 수 있습니다 ',
        );
      }
    }

    return ReviewDto.from(review);
  }

  async getReviews(
    query: ReviewQuery,
    user: UserBaseInfo,
  ): Promise<ReviewListDto> {
    const reviews = await this.reviewRepository.getReviews(query, user.id);

    const eventIds = Array.from(
      new Set(reviews.map((review) => review.eventId)),
    );

    const events = await this.reviewRepository.getEventsByIds(eventIds);

    const joinedEventIds = await this.reviewRepository.getUserJoinedEventIds(
      eventIds,
      user.id,
    );

    const joinedClubIds = await this.reviewRepository.getUserJoinedClubIds(
      user.id,
    );

    const filteredReviews = reviews.filter((review) => {
      const event = events.find((e) => e.id === review.eventId);

      if (!event) {
        throw new InternalServerErrorException('서버 오류');
      }
      if (!event.isArchived) {
        if (!event.clubId) {
          return true;
        }
        if (event.clubId) {
          return joinedClubIds.includes(event.clubId);
        }
      }
      return joinedEventIds.includes(event.id);
    });

    return ReviewListDto.from(filteredReviews);
  }

  async putUpdateReview(
    reviewId: number,
    payload: PutUpdateReviewPayload,
    user: UserBaseInfo,
  ): Promise<ReviewDto> {
    await this.checkPermissionForModifyReview(reviewId, user.id);

    const updateData: UpdateReviewData = {
      score: payload.score,
      title: payload.title,
      description: payload.description ?? null,
    };

    const updatedReview = await this.reviewRepository.updateReview(
      reviewId,
      updateData,
    );

    return ReviewDto.from(updatedReview);
  }

  async patchUpdateReview(
    reviewId: number,
    payload: PatchUpdateReviewPayload,
    user: UserBaseInfo,
  ): Promise<ReviewDto> {
    if (payload.score === null) {
      throw new BadRequestException('score는 null이 될 수 없습니다.');
    }

    if (payload.title === null) {
      throw new BadRequestException('title은 null이 될 수 없습니다.');
    }

    await this.checkPermissionForModifyReview(reviewId, user.id);

    const updateData: UpdateReviewData = {
      score: payload.score,
      title: payload.title,
      description: payload.description,
    };

    const updatedReview = await this.reviewRepository.updateReview(
      reviewId,
      updateData,
    );

    return ReviewDto.from(updatedReview);
  }

  async deleteReview(reviewId: number, user: UserBaseInfo): Promise<void> {
    await this.checkPermissionForModifyReview(reviewId, user.id);

    await this.reviewRepository.deleteReview(reviewId);
  }

  private async checkPermissionForModifyReview(
    reviewId: number,
    userId: number,
  ): Promise<void> {
    const review = await this.reviewRepository.getReviewById(reviewId);

    if (!review) {
      throw new NotFoundException('Review가 존재하지 않습니다.');
    }

    if (review.userId !== userId) {
      throw new ConflictException('해당 리뷰를 삭제할 권한이 없습니다.');
    }
  }
}
