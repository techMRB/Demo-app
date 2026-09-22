import mongoose from 'mongoose';

const permissionSchema = new mongoose.Schema({
    key: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    label: {
        type: String,
        required: true,
        trim: true,
    },
    module: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
    },
    description: {
        type: String,
        trim: true,
        default: '',
    },
    isSystem: {
        type: Boolean,
        default: false
    },
      
}, { timestamps: true }  
);

permissionSchema.index({ module: 1, key: 1, });

const Permission = mongoose.model('Permission', permissionSchema);

export default Permission;