function validate(schema, source = "body") {
  return (req, res, next) => {
    const data = source === "query" ? req.query : req.body;
    const { error, value } = schema.validate(data, { abortEarly: false, stripUnknown: true });
    if (error) {
      const messages = error.details.map((d) => d.message);
      return res.status(400).json({ error: "Dados inválidos", details: messages });
    }
    if (source === "query") {
      req.query = value;
    } else {
      req.body = value;
    }
    next();
  };
}

module.exports = validate;
