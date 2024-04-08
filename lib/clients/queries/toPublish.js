module.exports = (config) => {
  return {
    // NB. properties are case sensitive!
    and: [
      {
        property: "Type",
        select: {
          equals: config.notionPageType,
        },
      },
      {
        property: "Status",
        status: {
          equals: config.notionReadyStatus,
        },
      },
      {
        property: "Publish Date",
        date: {
          equals: config.date,
        },
      },
    ],
  }
};
