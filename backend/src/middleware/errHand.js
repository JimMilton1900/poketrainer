export const MYSQL_ERRORS = {
  ER_DUP_ENTRY:                       [409, 'UNIQUE / PRIMARY KEY violated: that value already exists'],
  ER_NO_REFERENCED_ROW_2:             [400, 'FOREIGN KEY violated: the referenced row does not exist'],
  ER_ROW_IS_REFERENCED_2:             [409, 'FOREIGN KEY (RESTRICT): other rows still depend on this row'],
  ER_CHECK_CONSTRAINT_VIOLATED:       [400, 'CHECK constraint violated'],
  ER_BAD_NULL_ERROR:                  [400, 'NOT NULL violated: a required column was empty'],
  ER_NO_DEFAULT_FOR_FIELD:            [400, 'NOT NULL violated: a required field is missing and has no DEFAULT'],
  ER_DATA_TOO_LONG:                   [400, 'Value is too long for the column'],
  ER_WARN_DATA_OUT_OF_RANGE:          [400, 'Number is out of range for the column type'],
  ER_TRUNCATED_WRONG_VALUE_FOR_FIELD: [400, 'Wrong type of value for the column'],
  ER_NON_UPDATABLE_TABLE:             [400, 'VIEW is read-only: it uses GROUP BY / aggregates, so MySQL cannot map a write back to the base tables'],
};

// Returns { status, error, constraint, mysql } for known MySQL errors, otherwise null
export function explainMysqlError(err) {
  const known = MYSQL_ERRORS[err.code];
  if (!known) return null;
  const msg = err.sqlMessage || '';
  const constraint =
    msg.match(/constraint '([^']+)'/i)?.[1] ||   // CHECK
    msg.match(/CONSTRAINT `([^`]+)`/)?.[1] ||    // FOREIGN KEY
    msg.match(/for key '([^']+)'/)?.[1] ||       // UNIQUE / PK
    null;
  return {
    status: known[0],
    error: known[1],
    constraint,
    mysql: { code: err.code, errno: err.errno, message: msg },
  };
}

export const notFound = (req, res) =>
  res.status(404).json({ error: `No route for ${req.method} ${req.originalUrl}` });

export function errorHandler(err, req, res, next) {
  if (err.status) return res.status(err.status).json({ error: err.message });

  const info = explainMysqlError(err);
  if (info) {
    const { status, ...body } = info;
    return res.status(status).json(body);
  }

  console.error(err);
  res.status(500).json({
    error: 'Internal server error',
    mysql: { code: err.code, message: err.sqlMessage || err.message },
  });
}