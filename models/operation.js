import mongoose from "mongoose";

export const operationSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true
    },
    security: {
        type: String, 
        required: false,
        minlength: 3,
        maxlength: 255
    },
    isin: {
        type: String,
        required: false,
        minlength: 12,
        maxlength: 12
    },
    type: {
        type: String,
        required: true,
        enum: ["BUY", "SELL", "FEES", "TAXES", "DIVIDEND", "INVESTMENT", "DESINVESTMENT", "REGULARISATION", "OTHER"],
        default: "OTHER"
    },
    account: {
        type: String,
        required: true, 
        enum: ["CTO", "PEA"],
        default: "CTO"
    },
    broker: {
        type: String,
        required: true, 
        default: "BOURSE DIRECT"
    },
    quantity: {
        type: Number,
        required: false
    },
    amount: {
        type: Number, 
        required: true
    },
    url: {
        type: String,
        required: false,
        validate: {
            validator: function(v) {
                return /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/.test(v);
            },
            message: props => `${props.value} is not a valid URL!`
        }
    }
});

export const Operation = mongoose.model('Operation', operationSchema);

console.log(
    `${JSON.stringify(Operation.schema.obj)}`
);
// const operation = Operation(
//     {
//         date: new Date(Date.now()),
//         amount: 100
//     }
// );
// await operation.validate();
