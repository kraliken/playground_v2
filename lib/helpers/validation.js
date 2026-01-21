
export function zodFieldErrors(zodError) {
    const fieldErrors = {};
    zodError.issues.forEach((issue) => {
        const fieldName = issue.path?.[0];
        if (!fieldErrors[fieldName]) fieldErrors[fieldName] = issue.message;
    });
    return fieldErrors;
}