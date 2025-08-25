import mongoose from "mongoose";
import { Operation, operationSchema } from "./operation.js";

export const operationsSchema = new mongoose.Schema({
    operations: [
        operationSchema
    ]
});

export const Operations = mongoose.model('Operations', operationsSchema);

// const operations = Operations({
//     operations: [
//         Operation(
//             {
//                 date: new Date(Date.now()),
//                 amount: 20
//             }
//         )
//     ]
// });

// await operations.validate();