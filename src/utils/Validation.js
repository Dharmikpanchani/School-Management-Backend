import joi from 'joi';
import { joiPasswordExtendCore } from 'joi-password';
const joiPassword = joi.extend(joiPasswordExtendCore);
const joistring = joi.string();

const adminLoginSchema = joi.object().keys({
  email: joistring.email().required().label('Email'),
  password: joistring.required().label('Password'),
  schoolCode: joistring.required().label('School Code'),
});

const changePasswordSchema = joi.object().keys({
  oldPassword: joiPassword
    .string()
    .minOfSpecialCharacters(1)
    .messages({
      'password.minOfSpecialCharacters':
        'Old password must include at least one special character.',
    })
    .minOfLowercase(1)
    .messages({
      'password.minOfLowercase':
        'Old password must include at least one lowercase letter.',
    })
    .minOfUppercase(1)
    .messages({
      'password.minOfUppercase':
        'Old password must include at least one uppercase letter.',
    })
    .minOfNumeric(1)
    .messages({
      'password.minOfNumeric':
        'Old password must include at least one numeric digit.',
    })
    .noWhiteSpaces()
    .messages({
      'password.noWhiteSpaces': 'Old password must not contain whitespace.',
    })
    .min(8)
    .messages({
      'password.min': 'Old password must be at least 8 characters long.',
    })
    .required()
    .label('Old password'),

  newPassword: joiPassword
    .string()
    .minOfSpecialCharacters(1)
    .messages({
      'password.minOfSpecialCharacters':
        'New password must include at least one special character.',
    })
    .minOfLowercase(1)
    .messages({
      'password.minOfLowercase':
        'New password must include at least one lowercase letter.',
    })
    .minOfUppercase(1)
    .messages({
      'password.minOfUppercase':
        'New password must include at least one uppercase letter.',
    })
    .minOfNumeric(1)
    .messages({
      'password.minOfNumeric':
        'New password must include at least one numeric digit.',
    })
    .noWhiteSpaces()
    .messages({
      'password.noWhiteSpaces': 'New password must not contain whitespace.',
    })
    .min(8)
    .messages({
      'password.min': 'New password must be at least 8 characters long.',
    })
    .required()
    .label('New password'),

  confirmPassword: joiPassword
    .string()
    .minOfSpecialCharacters(1)
    .messages({
      'password.minOfSpecialCharacters':
        'Confirm password must include at least one special character.',
    })
    .minOfLowercase(1)
    .messages({
      'password.minOfLowercase':
        'Confirm password must include at least one lowercase letter.',
    })
    .minOfUppercase(1)
    .messages({
      'password.minOfUppercase':
        'Confirm password must include at least one uppercase letter.',
    })
    .minOfNumeric(1)
    .messages({
      'password.minOfNumeric':
        'Confirm password must include at least one numeric digit.',
    })
    .noWhiteSpaces()
    .messages({
      'password.noWhiteSpaces': 'Confirm password must not contain whitespace.',
    })
    .min(8)
    .messages({
      'password.min': 'Confirm password must be at least 8 characters long.',
    })
    .required()
    .label('Confirm password'),
});

const adminForgotPasswordSchema = joi.object().keys({
  email: joistring.email().required().label('Email'),
  schoolCode: joi.string().required().label('School Code'),
});

const adminResetPasswordSchema = joi.object().keys({
  email: joistring.email().required().label('Email'),
  schoolCode: joi.string().required().label('School Code'),
  newPassword: joiPassword
    .string()
    .minOfSpecialCharacters(1)
    .messages({
      'password.minOfSpecialCharacters':
        'New password must include at least one special character.',
    })
    .minOfLowercase(1)
    .messages({
      'password.minOfLowercase':
        'New password must include at least one lowercase letter.',
    })
    .minOfUppercase(1)
    .messages({
      'password.minOfUppercase':
        'New password must include at least one uppercase letter.',
    })
    .minOfNumeric(1)
    .messages({
      'password.minOfNumeric':
        'New password must include at least one numeric digit.',
    })
    .noWhiteSpaces()
    .messages({
      'password.noWhiteSpaces': 'New password must not contain whitespace.',
    })
    .min(8)
    .messages({
      'password.min': 'New password must be at least 8 characters long.',
    })
    .required()
    .label('New password'),

  confirmPassword: joiPassword
    .string()
    .minOfSpecialCharacters(1)
    .messages({
      'password.minOfSpecialCharacters':
        'Confirm password must include at least one special character.',
    })
    .minOfLowercase(1)
    .messages({
      'password.minOfLowercase':
        'Confirm password must include at least one lowercase letter.',
    })
    .minOfUppercase(1)
    .messages({
      'password.minOfUppercase':
        'Confirm password must include at least one uppercase letter.',
    })
    .minOfNumeric(1)
    .messages({
      'password.minOfNumeric':
        'Confirm password must include at least one numeric digit.',
    })
    .noWhiteSpaces()
    .messages({
      'password.noWhiteSpaces': 'Confirm password must not contain whitespace.',
    })
    .min(8)
    .messages({
      'password.min': 'Confirm password must be at least 8 characters long.',
    })
    .required()
    .label('Confirm password'),
});

const schoolRegisterSchema = joi.object({
  schoolName: joistring.required().label('school name'),
  ownerName: joistring.required().label('Owner name'),
  email: joistring.email().required().label('Email'),
  phoneNumber: joistring.required().label('Phone number'),
  schoolCode: joistring.required().label('School code'),
  address: joistring.required().label('Address'),
  country: joistring.required().label('Country'),
  state: joistring.required().label('State'),
  city: joistring.required().label('City'),
  zipCode: joistring.required().label('Pincode'),
  board: joistring
    .valid('CBSE', 'GSEB', 'ICSE', 'Other')
    .required()
    .label('Board'),
  schoolType: joistring
    .valid('Primary', 'Secondary', 'Higher Secondary')
    .required()
    .label('School Type'),
  logo: joistring.optional().allow('').label('Logo'),
  password: joiPassword
    .string()
    .min(8)
    .minOfUppercase(1)
    .minOfLowercase(1)
    .minOfNumeric(1)
    .minOfSpecialCharacters(1)
    .noWhiteSpaces()
    .required()
    .label('Password'),
});

const schoolVerifyEmailSchema = joi.object({
  email: joistring.email().required().label('Email'),
  otp: joistring.required().length(6).label('OTP'),
});

const getSchoolImageSchema = joi.object({
  schoolCode: joistring.required().label('School Code'),
});

const schoolResendOtpSchema = joi.object({
  email: joistring.email().required().label('Email'),
});

const schoolUpdateProfileSchema = joi.object({
  schoolName: joistring.optional().label('school name'),
  ownerName: joistring.optional().label('Owner name'),
  phoneNumber: joistring.optional().label('Phone number'),
  address: joistring.optional().allow('').label('Address'),
  city: joistring.optional().allow('').label('City'),
  state: joistring.optional().allow('').label('State'),
  zipCode: joistring.optional().allow('').label('Zip Code'),
  country: joistring.optional().allow('').label('Country'),
  logo: joistring.optional().allow('').label('Logo'),
});

const adminVerifyRegistrationOtpSchema = joi.object({
  email: joistring.email().required().label('Email'),
  otp: joistring.required().length(6).label('OTP'),
  school_id: joistring.required().label('School ID'),
});

const developerLoginSchema = joi.object().keys({
  email: joistring.email().required().label('Email'),
  password: joistring.required().label('Password'),
});

const developerForgotPasswordSchema = joi.object().keys({
  email: joistring.email().required().label('Email'),
});

const developerResetPasswordSchema = joi.object().keys({
  email: joistring.email().required().label('Email'),
  newPassword: joiPassword
    .string()
    .minOfSpecialCharacters(1)
    .messages({
      'password.minOfSpecialCharacters':
        'New password must include at least one special character.',
    })
    .minOfLowercase(1)
    .messages({
      'password.minOfLowercase':
        'New password must include at least one lowercase letter.',
    })
    .minOfUppercase(1)
    .messages({
      'password.minOfUppercase':
        'New password must include at least one uppercase letter.',
    })
    .minOfNumeric(1)
    .messages({
      'password.minOfNumeric':
        'New password must include at least one numeric digit.',
    })
    .noWhiteSpaces()
    .messages({
      'password.noWhiteSpaces': 'New password must not contain whitespace.',
    })
    .min(8)
    .messages({
      'password.min': 'New password must be at least 8 characters long.',
    })
    .required()
    .label('New password'),

  confirmPassword: joiPassword
    .string()
    .minOfSpecialCharacters(1)
    .messages({
      'password.minOfSpecialCharacters':
        'Confirm password must include at least one special character.',
    })
    .minOfLowercase(1)
    .messages({
      'password.minOfLowercase':
        'Confirm password must include at least one lowercase letter.',
    })
    .minOfUppercase(1)
    .messages({
      'password.minOfUppercase':
        'Confirm password must include at least one uppercase letter.',
    })
    .minOfNumeric(1)
    .messages({
      'password.minOfNumeric':
        'Confirm password must include at least one numeric digit.',
    })
    .noWhiteSpaces()
    .messages({
      'password.noWhiteSpaces': 'Confirm password must not contain whitespace.',
    })
    .min(8)
    .messages({
      'password.min': 'Confirm password must be at least 8 characters long.',
    })
    .required()
    .label('Confirm password'),
});

const developerUpdateProfileSchema = joi.object({
  name: joistring.optional().label('Name'),
  email: joistring.optional().email().label('Email'),
  phoneNumber: joistring.optional().label('Phone number'),
  address: joistring.optional().allow('').label('Address'),
  image: joistring.optional().allow('').label('Image'),
});

const adminVerifyLoginOtpSchema = joi.object({
  email: joistring.email().required().label('Email'),
  otp: joistring.required().length(6).label('OTP'),
  schoolCode: joi.string().required().label('School Code'),
});

const developerVerifyOtpCommonSchema = joi.object({
  email: joistring.email().required().label('Email'),
  otp: joistring.required().length(6).label('OTP'),
  type: joistring
    .valid('login', 'registration', 'forgotPassword', 'schoolRegistration')
    .required()
    .label('Type'),
});

const developerSendOtpCommonSchema = joi.object({
  email: joistring.email().required().label('Email'),
  type: joistring
    .valid('login', 'registration', 'forgotPassword', 'schoolRegistration')
    .required()
    .label('Type'),
});

const adminVerifyOtpCommonSchema = joi.object({
  email: joistring.email().required().label('Email'),
  otp: joistring.required().length(6).label('OTP'),
  type: joistring
    .valid('login', 'registration', 'forgotPassword')
    .required()
    .label('Type'),
  schoolCode: joistring.optional().label('School Code'),
  school_id: joistring.optional().label('School ID'),
});

const adminSendOtpCommonSchema = joi.object({
  email: joistring.email().required().label('Email'),
  type: joistring
    .valid('login', 'registration', 'forgotPassword')
    .required()
    .label('Type'),
  schoolCode: joistring.optional().label('School Code'),
  school_id: joistring.optional().label('School ID'),
});

export default {
  adminLoginSchema,
  changePasswordSchema,
  adminForgotPasswordSchema,
  adminResetPasswordSchema,
  schoolRegisterSchema,
  schoolVerifyEmailSchema,
  schoolResendOtpSchema,
  schoolUpdateProfileSchema,
  adminVerifyRegistrationOtpSchema,
  developerLoginSchema,
  developerForgotPasswordSchema,
  developerResetPasswordSchema,
  developerUpdateProfileSchema,
  adminVerifyLoginOtpSchema,
  developerVerifyOtpCommonSchema,
  developerSendOtpCommonSchema,
  getSchoolImageSchema,
  adminVerifyOtpCommonSchema,
  adminSendOtpCommonSchema,
};
