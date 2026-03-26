import joi from 'joi';
import { joiPasswordExtendCore } from 'joi-password';
const joiPassword = joi.extend(joiPasswordExtendCore);
const joistring = joi.string();

const signupSchema = joiPassword.object({
  masterId: joi
    .alternatives()
    .try(
      joi.string().email().label('Email'),
      joi
        .string()
        .pattern(/^[0-9]{10,15}$/)
        .label('Phone number') // Adjust the digit length as needed
    )
    .required()
    .label('Email or Phone number'),
  password: joiPassword
    .string()
    .min(8)
    .minOfUppercase(1)
    .minOfLowercase(1)
    .minOfNumeric(1)
    .minOfSpecialCharacters(1)
    .noWhiteSpaces()
    .required()
    .messages({
      'password.minOfUppercase':
        'Password must contain at least 1 uppercase letter.',
      'password.minOfLowercase':
        'Password must contain at least 1 lowercase letter.',
      'password.minOfNumeric': 'Password must contain at least 1 number.',
      'password.minOfSpecialCharacters':
        'Password must contain at least 1 special character.',
      'password.noWhiteSpaces': 'Password must not contain white spaces.',
      'string.min': 'Password must be at least 8 characters long.',
      'any.required': 'Password is required.',
    }),
  gender: joistring.required().label('Gender'),
  fullName: joistring.required().label('Full name'),
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

const adminLoginSchema = joi.object().keys({
  email: joistring.email().required().label('Email'),
  password: joistring.required().label('Password'),
  schoolCode: joistring.required().label('School Code'),
});

const loginSchema = joi.object().keys({
  masterId: joi
    .alternatives()
    .try(
      joi.string().email().label('Email'),
      joi
        .string()
        .pattern(/^[0-9]{10,15}$/)
        .label('Phone number') // Adjust the digit length as needed
    )
    .required()
    .label('Email or Phone number'),
  password: joistring.required().label('Password'),
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

const forgotPasswordSchema = joi.object().keys({
  masterId: joi
    .alternatives()
    .try(
      joi.string().email().label('Email'),
      joi
        .string()
        .pattern(/^[0-9]{10,15}$/)
        .label('Phone number') // Adjust the digit length as needed
    )
    .required()
    .label('Email or Phone number'),
});

const resetPasswordSchema = joi.object().keys({
  masterId: joi
    .alternatives()
    .try(
      joi.string().email().label('Email'),
      joi
        .string()
        .pattern(/^[0-9]{10,15}$/)
        .label('Phone number') // Adjust the digit length as needed
    )
    .required()
    .label('Email or Phone number'),
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
  referralId: joistring.optional().allow('').label('Referral ID'),
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

const schoolLoginSchema = joi.object({
  email: joistring.email().required().label('Email'),
  password: joistring.required().label('Password'),
});

const schoolResendOtpSchema = joi.object({
  email: joistring.email().required().label('Email'),
});

const schoolForgotPasswordSchema = joi.object({
  email: joistring.email().required().label('Email'),
});

const schoolVerifyForgotPasswordOtpSchema = joi.object({
  email: joistring.email().required().label('Email'),
  otp: joistring.required().length(6).label('OTP'),
});

const schoolResetPasswordSchema = joi.object({
  email: joistring.email().required().label('Email'),
  password: joiPassword.string().min(8).required().label('Password'),
});

const schoolChangePasswordSchema = joi.object({
  oldPassword: joistring.required().label('Old Password'),
  newPassword: joiPassword.string().min(8).required().label('New Password'),
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

const adminCreateUserSchema = joi.object({
  fullName: joistring.required().label('Full Name'),
  email: joistring.email().required().label('Email'),
  phoneNumber: joistring.required().label('Phone number'),
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
  address: joistring.optional().allow(''),
  gender: joistring.required().label('Gender'),
  schoolId: joistring.optional().allow(''),
  schoolName: joistring.optional().allow(''),
  schoolEmail: joistring.email().optional().allow(''),
});

const adminVerifyUserOtpSchema = joi.object({
  email: joistring.email().required().label('Email'),
  otp: joistring.required().length(6).label('OTP'),
});

const addEditSalesSchema = joi.object({
  id: joistring.optional().allow('').label('ID'),
  email: joistring.email().required().label('Email'),
  number: joistring.required().label('Phone number'),
  upiId: joistring.optional().allow('').label('UPI ID'),
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

const developerVerifyRegistrationOtpSchema = joi.object({
  email: joistring.email().required().label('Email'),
  otp: joistring.required().length(6).label('OTP'),
});

const developerUpdateProfileSchema = joi.object({
  name: joistring.optional().label('Name'),
  email: joistring.optional().email().label('Email'),
  phoneNumber: joistring.optional().label('Phone number'),
  address: joistring.optional().allow('').label('Address'),
  image: joistring.optional().allow('').label('Image'),
});

const developerVerifyLoginOtpSchema = joi.object({
  email: joistring.email().required().label('Email'),
  otp: joistring.required().length(6).label('OTP'),
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
    .valid('login', 'registration', 'forgotPassword')
    .required()
    .label('Type'),
});

const developerSendOtpCommonSchema = joi.object({
  email: joistring.email().required().label('Email'),
  type: joistring
    .valid('login', 'registration', 'forgotPassword')
    .required()
    .label('Type'),
});

export default {
  adminLoginSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  signupSchema,
  loginSchema,
  adminForgotPasswordSchema,
  adminResetPasswordSchema,
  schoolRegisterSchema,
  schoolVerifyEmailSchema,
  schoolLoginSchema,
  schoolResendOtpSchema,
  schoolForgotPasswordSchema,
  schoolVerifyForgotPasswordOtpSchema,
  schoolResetPasswordSchema,
  schoolChangePasswordSchema,
  schoolUpdateProfileSchema,
  adminVerifyRegistrationOtpSchema,
  adminCreateUserSchema,
  adminVerifyUserOtpSchema,
  addEditSalesSchema,
  developerLoginSchema,
  developerForgotPasswordSchema,
  developerResetPasswordSchema,
  developerVerifyRegistrationOtpSchema,
  developerUpdateProfileSchema,
  developerVerifyLoginOtpSchema,
  adminVerifyLoginOtpSchema,
  developerVerifyOtpCommonSchema,
  developerSendOtpCommonSchema,
};
