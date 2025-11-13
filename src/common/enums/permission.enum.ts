export enum PermissionName {
  // MOVIE
  MOVIE_CREATE = 'movie_create',
  MOVIE_UPDATE = 'movie_update',
  MOVIE_DELETE = 'movie_delete',
  MOVIE_READ = 'movie_read',
  MOVIE_READ_BY_DAY = 'movie_read_by_day',
  MOVIE_READ_BY_TIME = 'movie_read_by_time',
  MOVIE_READ_BY_NAME = 'movie_read_by_name',

  //ACTOR
  ACTOR_CREATE = 'actor_create',
  ACTOR_UPDATE = 'actor_update',
  ACTOR_DELETE = 'actor_delete',
  ACTOR_READ = 'actor_read',

  //GENDRE
  GENDRE_CREATE = 'gendre_create',
  GENDRE_UPDATE = 'gendre_update',
  GENDRE_DELETE = 'gendre_delete',
  GENDRE_READ = 'gendre_read',

  //REFRESHMENTS
  REFRESHMENTS_CREATE = 'refreshments_create',
  REFRESHMENTS_UPDATE = 'refreshments_update',
  REFRESHMENTS_DELETE = 'refreshments_delete',
  REFRESHMENTS_READ = 'refreshments_read',

  //BRANCH
  BRANCH_CREATE = 'branch_create',
  BRANCH_UPDATE = 'branch_update',
  BRANCH_DELETE = 'branch_delete',
  BRANCH_READ = 'branch_read',

  //VOUCHER
  VOUCHER_CREATE = 'voucher_create',
  VOUCHER_UPDATE = 'voucher_update',
  VOUCHER_DELETE = 'voucher_delete',
  VOUCHER_READ = 'voucher_read',

  //TYPE_DAY
  TYPE_DAY_UPDATE = 'type_day_update',
  TYPE_DAY_READ = 'type_day_read',

  //SPECIAL_DAY
  SPECIAL_DAY_CREATE = 'special_day_create',
  SPECIAL_DAY_UPDATE = 'special_day_update',
  SPECIAL_DAY_DELETE = 'special_day_delete',
  SPECIAL_DAY_READ = 'special_day_read',

  //TYPE_SEAT
  TYPE_SEAT_CREATE = 'type_seat_create',
  TYPE_SEAT_UPDATE = 'type_seat_update',
  TYPE_SEAT_DELETE = 'type_seat_delete',
  TYPE_SEAT_READ = 'type_seat_read',

  //ROOM
  ROOM_CREATE = 'room_create',
  ROOM_UPDATE = 'room_update',
  ROOM_DELETE = 'room_delete',
  ROOM_READ = 'room_read',

  //SEAT
  SEAT_CREATE = 'seat_create',
  SEAT_UPDATE = 'seat_update',
  SEAT_DELETE = 'seat_delete',
  SEAT_READ = 'seat_read',
  SEAT_READ_BY_SHOW_TIME = 'seat_read_by_show_time',

  //REVIEW
  REVIEW_READ_IN_MOVIE = 'review_read_in_movie',
  REVIEW_CREATE_IN_MOVIE = 'review_create_in_movie',
  REVIEW_UPDATE_IN_MOVIE = 'review_update_in_movie',
  REVIEW_DELETE_IN_MOVIE = 'review_delete_in_movie',
  REVIEW_READ = 'review_read',
  REVIEW_DELETE = 'review_delete',

  //ACCOUNT
  ACCOUNT_CREATE = 'account_create',
  ACCOUNT_UPDATE = 'account_update',
  ACCOUNT_DELETE = 'account_delete',
  ACCOUNT_READ = 'account_read',
  ACCOUNT_CREATE_STAFF = 'account_create_staff',
  ACCOUNT_UPDATE_STAFF = 'account_update_staff',
  ACCOUNT_DELETE_STAFF = 'account_delete_staff',
  ACCOUNT_READ_STAFF = 'account_read_staff',
  ACCOUNT_READ_ME = 'account_read_me',
  ACCOUNT_UPDATE_ME = 'account_update_me',
  ACCOUNT_LOG_OUT = 'account_log_out',

  //BOOKING
  BOOKING_BY_CUSTOMER = 'booking_by_customer',
  BOOKING_BY_STAFF = 'booking_by_staff',
  BOOKING_CHECKIN = 'booking_checkin',

  //BOOK_REFRESHMENTS
  BOOK_REFRESHMENTS_AT_COUNTER = 'book_refreshments_at_counter',

  //SHOW_TIME
  SHOW_TIME_CREATE = 'show_time_create',
  SHOW_TIME_UPDATE = 'show_time_update',
  SHOW_TIME_DELETE = 'show_time_delete',
  SHOW_TIME_READ = 'show_time_read',
  SHOW_TIME_READ_BY_MOVIE_AND_DAY = 'show_time_read_by_movie_and_day',

  //ROLE
  ROLE_CREATE = 'role_create',
  ROLE_UPDATE = 'role_update',

  //PERMISSION
  PERMISSION_READ = 'permission_read'
}
