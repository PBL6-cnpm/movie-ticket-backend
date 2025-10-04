import { PermissionName, RoleName } from '@common/enums';

export const RolePermissionSeed: Record<RoleName, PermissionName[]> = {
  [RoleName.SUPER_ADMIN]: [],
  [RoleName.ADMIN]: [
    // MOVIE
    PermissionName.MOVIE_READ_BY_DAY,
    PermissionName.MOVIE_READ_BY_TIME,
    PermissionName.MOVIE_READ_BY_NAME,

    //ACTOR
    PermissionName.ACTOR_READ,

    //GENDRE

    //REFRESHMENTS
    PermissionName.REFRESHMENTS_READ,

    //BRANCH
    PermissionName.BRANCH_READ,

    //VOUCHER
    PermissionName.VOUCHER_READ,

    //TYPE_DAY

    //SPECIAL_DAY

    //TYPE_SEAT

    //ROOM
    PermissionName.ROOM_CREATE,
    PermissionName.ROOM_UPDATE,
    PermissionName.ROOM_DELETE,
    PermissionName.ROOM_READ,

    //SEAT
    PermissionName.SEAT_CREATE,
    PermissionName.SEAT_UPDATE,
    PermissionName.SEAT_DELETE,
    PermissionName.SEAT_READ,
    PermissionName.SEAT_READ_BY_SHOW_TIME,

    //REVIEW
    PermissionName.REVIEW_READ_IN_MOVIE,
    PermissionName.REVIEW_CREATE_IN_MOVIE,
    PermissionName.REVIEW_UPDATE_IN_MOVIE,
    PermissionName.REVIEW_DELETE_IN_MOVIE,
    PermissionName.REVIEW_READ,
    PermissionName.REVIEW_DELETE,

    //ACCOUNT
    PermissionName.ACCOUNT_CREATE_STAFF,
    PermissionName.ACCOUNT_UPDATE_STAFF,
    PermissionName.ACCOUNT_DELETE_STAFF,
    PermissionName.ACCOUNT_READ_STAFF,
    PermissionName.ACCOUNT_READ_ME,
    PermissionName.ACCOUNT_UPDATE_ME,
    PermissionName.ACCOUNT_LOG_OUT,

    //BOOKING
    PermissionName.BOOKING_BY_CUSTOMER,
    PermissionName.BOOKING_BY_STAFF,

    //BOOK_REFRESHMENTS
    PermissionName.BOOK_REFRESHMENTS_AT_COUNTER,

    //SHOW_TIME
    PermissionName.SHOW_TIME_CREATE,
    PermissionName.SHOW_TIME_UPDATE,
    PermissionName.SHOW_TIME_DELETE,
    PermissionName.SHOW_TIME_READ,
    PermissionName.SHOW_TIME_READ_BY_MOVIE_AND_DAY

    //ROLE

    //PERMISSION
  ],

  [RoleName.STAFF]: [
    // MOVIE
    PermissionName.MOVIE_READ_BY_DAY,
    PermissionName.MOVIE_READ_BY_TIME,
    PermissionName.MOVIE_READ_BY_NAME,

    //ACTOR
    PermissionName.ACTOR_READ,

    //GENDRE

    //REFRESHMENTS
    PermissionName.REFRESHMENTS_READ,

    //BRANCH
    PermissionName.BRANCH_READ,

    //VOUCHER
    PermissionName.VOUCHER_READ,

    //TYPE_DAY

    //SPECIAL_DAY

    //TYPE_SEAT

    //ROOM

    //SEAT
    PermissionName.SEAT_READ_BY_SHOW_TIME,

    //REVIEW
    PermissionName.REVIEW_READ,
    PermissionName.REVIEW_DELETE,

    //ACCOUNT
    PermissionName.ACCOUNT_READ_ME,
    PermissionName.ACCOUNT_UPDATE_ME,
    PermissionName.ACCOUNT_LOG_OUT,

    //BOOKING
    PermissionName.BOOKING_BY_CUSTOMER,
    PermissionName.BOOKING_BY_STAFF,

    //BOOK_REFRESHMENTS
    PermissionName.BOOK_REFRESHMENTS_AT_COUNTER,

    //SHOW_TIME
    PermissionName.SHOW_TIME_READ_BY_MOVIE_AND_DAY

    //ROLE

    //PERMISSION
  ],

  [RoleName.CUSTOMER]: [
    // MOVIE
    PermissionName.MOVIE_READ_BY_DAY,
    PermissionName.MOVIE_READ_BY_TIME,
    PermissionName.MOVIE_READ_BY_NAME,

    //ACTOR
    PermissionName.ACTOR_READ,

    //GENDRE

    //REFRESHMENTS
    PermissionName.REFRESHMENTS_READ,

    //BRANCH
    PermissionName.BRANCH_READ,

    //VOUCHER
    PermissionName.VOUCHER_READ,

    //TYPE_DAY

    //SPECIAL_DAY

    //TYPE_SEAT

    //ROOM

    //SEAT
    PermissionName.SEAT_READ_BY_SHOW_TIME,

    //REVIEW
    PermissionName.REVIEW_READ,
    PermissionName.REVIEW_DELETE,

    //ACCOUNT
    PermissionName.ACCOUNT_READ_ME,
    PermissionName.ACCOUNT_UPDATE_ME,
    PermissionName.ACCOUNT_LOG_OUT,

    //BOOKING
    PermissionName.BOOKING_BY_CUSTOMER,

    //BOOK_REFRESHMENTS

    //SHOW_TIME
    PermissionName.SHOW_TIME_READ_BY_MOVIE_AND_DAY

    //ROLE

    //PERMISSION
  ]
};
