import { PermissionName } from './permission.enum';
import { RoleName } from './role.enum';
export const RolePermissionSeed: Record<RoleName, PermissionName[]> = {
  [RoleName.SUPER_ADMIN]: [
    // MOVIE
    PermissionName.MOVIE_CREATE,
    PermissionName.MOVIE_UPDATE,
    PermissionName.MOVIE_DELETE,
    PermissionName.MOVIE_READ,
    PermissionName.MOVIE_READ_BY_DAY,
    PermissionName.MOVIE_READ_BY_TIME,
    PermissionName.MOVIE_READ_BY_NAME,

    //ACTOR
    PermissionName.ACTOR_CREATE,
    PermissionName.ACTOR_UPDATE,
    PermissionName.ACTOR_DELETE,
    PermissionName.ACTOR_READ,

    //GENDRE
    PermissionName.GENDRE_CREATE,
    PermissionName.GENDRE_UPDATE,
    PermissionName.GENDRE_DELETE,
    PermissionName.GENDRE_READ,

    //REFRESHMENTS
    PermissionName.REFRESHMENTS_CREATE,
    PermissionName.REFRESHMENTS_UPDATE,
    PermissionName.REFRESHMENTS_DELETE,
    PermissionName.REFRESHMENTS_READ,

    //BRANCH
    PermissionName.BRANCH_CREATE,
    PermissionName.BRANCH_UPDATE,
    PermissionName.BRANCH_DELETE,
    PermissionName.BRANCH_READ,

    //VOUCHER
    PermissionName.VOUCHER_CREATE,
    PermissionName.VOUCHER_UPDATE,
    PermissionName.VOUCHER_DELETE,
    PermissionName.VOUCHER_READ,

    //TYPE_DAY
    PermissionName.TYPE_DAY_UPDATE,
    PermissionName.TYPE_DAY_READ,

    //SPECIAL_DAY
    PermissionName.SPECIAL_DAY_CREATE,
    PermissionName.SPECIAL_DAY_UPDATE,
    PermissionName.SPECIAL_DAY_DELETE,
    PermissionName.SPECIAL_DAY_READ,

    //TYPE_SEAT
    PermissionName.TYPE_SEAT_CREATE,
    PermissionName.TYPE_SEAT_UPDATE,
    PermissionName.TYPE_SEAT_DELETE,
    PermissionName.TYPE_SEAT_READ,

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
    PermissionName.ACCOUNT_CREATE,
    PermissionName.ACCOUNT_UPDATE,
    PermissionName.ACCOUNT_DELETE,
    PermissionName.ACCOUNT_READ,
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
    PermissionName.SHOW_TIME_READ_BY_MOVIE_AND_DAY,

    //ROLE
    PermissionName.ROLE_CREATE,
    PermissionName.ROLE_UPDATE,

    //PERMISSION
    PermissionName.PERMISSION_READ
  ],

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
