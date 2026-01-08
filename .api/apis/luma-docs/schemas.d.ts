declare const GetV1CalendarCoupons: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly pagination_cursor: {
                    readonly description: "Value of `next_cursor` from a previous request.";
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
                readonly pagination_limit: {
                    readonly description: "The number of items to return. The server will enforce a maximum number.";
                    readonly type: "number";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
            };
            readonly required: readonly [];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly $schema: "https://json-schema.org/draft/2020-12/schema";
            readonly type: "object";
            readonly properties: {
                readonly entries: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly api_id: {
                                readonly type: "string";
                            };
                            readonly code: {
                                readonly description: "This code is case insensitive.";
                                readonly type: "string";
                            };
                            readonly remaining_count: {
                                readonly type: "integer";
                                readonly minimum: -9007199254740991;
                                readonly maximum: 9007199254740991;
                            };
                            readonly valid_start_at: {
                                readonly anyOf: readonly [{
                                    readonly description: "ISO 8601 Datetime. For example, 2022-10-19T03:27:13.673Z";
                                    readonly type: "string";
                                    readonly format: "date-time";
                                    readonly pattern: "^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d+)?)?(?:Z|([+-](?:[01]\\d|2[0-3]):[0-5]\\d)))$";
                                }, {
                                    readonly type: "null";
                                }];
                            };
                            readonly valid_end_at: {
                                readonly anyOf: readonly [{
                                    readonly description: "ISO 8601 Datetime. For example, 2022-10-19T03:27:13.673Z";
                                    readonly type: "string";
                                    readonly format: "date-time";
                                    readonly pattern: "^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d+)?)?(?:Z|([+-](?:[01]\\d|2[0-3]):[0-5]\\d)))$";
                                }, {
                                    readonly type: "null";
                                }];
                            };
                            readonly percent_off: {
                                readonly anyOf: readonly [{
                                    readonly type: "number";
                                }, {
                                    readonly type: "null";
                                }];
                            };
                            readonly cents_off: {
                                readonly anyOf: readonly [{
                                    readonly type: "number";
                                }, {
                                    readonly type: "null";
                                }];
                            };
                            readonly currency: {
                                readonly anyOf: readonly [{
                                    readonly type: "string";
                                    readonly enum: readonly ["solana_sol", "solana_usdc", "aed", "afn", "all", "amd", "ang", "aoa", "ars", "aud", "awg", "azn", "bam", "bbd", "bdt", "bgn", "bhd", "bif", "bmd", "bnd", "bob", "brl", "bsd", "bwp", "byn", "bzd", "cad", "cdf", "chf", "clp", "cny", "cop", "crc", "cve", "czk", "djf", "dkk", "dop", "dzd", "egp", "etb", "eur", "fjd", "fkp", "gbp", "gel", "ghs", "gip", "gmd", "gnf", "gtq", "gyd", "hkd", "hnl", "htg", "huf", "idr", "ils", "inr", "isk", "jmd", "jod", "jpy", "kes", "kgs", "khr", "kmf", "krw", "kwd", "kyd", "kzt", "lak", "lbp", "lkr", "lrd", "lsl", "mad", "mdl", "mga", "mkd", "mmk", "mnt", "mop", "mur", "mvr", "mwk", "mxn", "myr", "mzn", "nad", "ngn", "nio", "nok", "npr", "nzd", "omr", "pab", "pen", "pgk", "php", "pkr", "pln", "pyg", "qar", "ron", "rsd", "rub", "rwf", "sar", "sbd", "scr", "sek", "sgd", "shp", "sle", "sos", "srd", "std", "szl", "thb", "tjs", "tnd", "top", "try", "ttd", "twd", "tzs", "uah", "ugx", "usd", "uyu", "uzs", "vnd", "vuv", "wst", "xaf", "xcd", "xof", "xpf", "yer", "zar", "zmw"];
                                    readonly description: "`solana_sol` `solana_usdc` `aed` `afn` `all` `amd` `ang` `aoa` `ars` `aud` `awg` `azn` `bam` `bbd` `bdt` `bgn` `bhd` `bif` `bmd` `bnd` `bob` `brl` `bsd` `bwp` `byn` `bzd` `cad` `cdf` `chf` `clp` `cny` `cop` `crc` `cve` `czk` `djf` `dkk` `dop` `dzd` `egp` `etb` `eur` `fjd` `fkp` `gbp` `gel` `ghs` `gip` `gmd` `gnf` `gtq` `gyd` `hkd` `hnl` `htg` `huf` `idr` `ils` `inr` `isk` `jmd` `jod` `jpy` `kes` `kgs` `khr` `kmf` `krw` `kwd` `kyd` `kzt` `lak` `lbp` `lkr` `lrd` `lsl` `mad` `mdl` `mga` `mkd` `mmk` `mnt` `mop` `mur` `mvr` `mwk` `mxn` `myr` `mzn` `nad` `ngn` `nio` `nok` `npr` `nzd` `omr` `pab` `pen` `pgk` `php` `pkr` `pln` `pyg` `qar` `ron` `rsd` `rub` `rwf` `sar` `sbd` `scr` `sek` `sgd` `shp` `sle` `sos` `srd` `std` `szl` `thb` `tjs` `tnd` `top` `try` `ttd` `twd` `tzs` `uah` `ugx` `usd` `uyu` `uzs` `vnd` `vuv` `wst` `xaf` `xcd` `xof` `xpf` `yer` `zar` `zmw`";
                                }, {
                                    readonly type: "null";
                                }];
                            };
                        };
                        readonly required: readonly ["api_id", "code", "remaining_count", "valid_start_at", "valid_end_at", "percent_off", "cents_off", "currency"];
                    };
                };
                readonly has_more: {
                    readonly type: "boolean";
                };
                readonly next_cursor: {
                    readonly type: "string";
                };
            };
            readonly required: readonly ["entries", "has_more"];
        };
    };
};
declare const GetV1CalendarListEvents: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly before: {
                    readonly description: "ISO 8601 Datetime. For example, 2022-10-19T03:27:13.673Z";
                    readonly type: "string";
                    readonly format: "date-time";
                    readonly pattern: "^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d+)?)?(?:Z|([+-](?:[01]\\d|2[0-3]):[0-5]\\d)))$";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
                readonly after: {
                    readonly description: "ISO 8601 Datetime. For example, 2022-10-19T03:27:13.673Z";
                    readonly type: "string";
                    readonly format: "date-time";
                    readonly pattern: "^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d+)?)?(?:Z|([+-](?:[01]\\d|2[0-3]):[0-5]\\d)))$";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
                readonly pagination_cursor: {
                    readonly description: "Value of `next_cursor` from a previous request.";
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
                readonly pagination_limit: {
                    readonly description: "The number of items to return. The server will enforce a maximum number.";
                    readonly type: "number";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
                readonly sort_column: {
                    readonly type: "string";
                    readonly enum: readonly ["start_at"];
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
                readonly sort_direction: {
                    readonly type: "string";
                    readonly enum: readonly ["asc", "desc", "asc nulls last", "desc nulls last"];
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
            };
            readonly required: readonly [];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly $schema: "https://json-schema.org/draft/2020-12/schema";
            readonly type: "object";
            readonly properties: {
                readonly entries: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly api_id: {
                                readonly type: "string";
                            };
                            readonly event: {
                                readonly type: "object";
                                readonly properties: {
                                    readonly id: {
                                        readonly type: "string";
                                    };
                                    readonly user_id: {
                                        readonly type: "string";
                                    };
                                    readonly calendar_id: {
                                        readonly type: "string";
                                    };
                                    readonly start_at: {
                                        readonly description: "ISO 8601 Datetime. For example, 2022-10-19T03:27:13.673Z";
                                        readonly type: "string";
                                        readonly format: "date-time";
                                        readonly pattern: "^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d+)?)?(?:Z|([+-](?:[01]\\d|2[0-3]):[0-5]\\d)))$";
                                    };
                                    readonly duration_interval: {
                                        readonly type: "string";
                                    };
                                    readonly end_at: {
                                        readonly description: "ISO 8601 Datetime. For example, 2022-10-19T03:27:13.673Z";
                                        readonly type: "string";
                                        readonly format: "date-time";
                                        readonly pattern: "^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d+)?)?(?:Z|([+-](?:[01]\\d|2[0-3]):[0-5]\\d)))$";
                                    };
                                    readonly created_at: {
                                        readonly description: "ISO 8601 Datetime. For example, 2022-10-19T03:27:13.673Z";
                                        readonly type: "string";
                                        readonly format: "date-time";
                                        readonly pattern: "^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d+)?)?(?:Z|([+-](?:[01]\\d|2[0-3]):[0-5]\\d)))$";
                                    };
                                    readonly timezone: {
                                        readonly description: "IANA Timezone, e.g. America/New_York. https://en.wikipedia.org/wiki/List_of_tz_database_time_zones";
                                        readonly type: "string";
                                    };
                                    readonly name: {
                                        readonly type: "string";
                                    };
                                    readonly description: {
                                        readonly type: "string";
                                    };
                                    readonly description_md: {
                                        readonly type: "string";
                                    };
                                    readonly geo_address_json: {
                                        readonly anyOf: readonly [{
                                            readonly type: "object";
                                            readonly properties: {
                                                readonly address: {
                                                    readonly type: "string";
                                                };
                                                readonly city: {
                                                    readonly anyOf: readonly [{
                                                        readonly type: "string";
                                                    }, {
                                                        readonly type: "null";
                                                    }];
                                                };
                                                readonly region: {
                                                    readonly anyOf: readonly [{
                                                        readonly type: "string";
                                                    }, {
                                                        readonly type: "null";
                                                    }];
                                                };
                                                readonly country: {
                                                    readonly anyOf: readonly [{
                                                        readonly type: "string";
                                                    }, {
                                                        readonly type: "null";
                                                    }];
                                                };
                                                readonly city_state: {
                                                    readonly anyOf: readonly [{
                                                        readonly type: "string";
                                                    }, {
                                                        readonly type: "null";
                                                    }];
                                                };
                                                readonly full_address: {
                                                    readonly anyOf: readonly [{
                                                        readonly type: "string";
                                                    }, {
                                                        readonly type: "null";
                                                    }];
                                                };
                                                readonly google_maps_place_id: {
                                                    readonly anyOf: readonly [{
                                                        readonly type: "string";
                                                    }, {
                                                        readonly type: "null";
                                                    }];
                                                };
                                                readonly apple_maps_place_id: {
                                                    readonly anyOf: readonly [{
                                                        readonly type: "string";
                                                    }, {
                                                        readonly type: "null";
                                                    }];
                                                };
                                                readonly description: {
                                                    readonly anyOf: readonly [{
                                                        readonly type: "string";
                                                    }, {
                                                        readonly type: "null";
                                                    }];
                                                };
                                            };
                                            readonly required: readonly ["address", "city", "region", "country", "city_state", "full_address", "google_maps_place_id", "apple_maps_place_id", "description"];
                                        }, {
                                            readonly type: "null";
                                        }];
                                    };
                                    readonly geo_latitude: {
                                        readonly anyOf: readonly [{
                                            readonly type: "string";
                                        }, {
                                            readonly type: "null";
                                        }];
                                    };
                                    readonly geo_longitude: {
                                        readonly anyOf: readonly [{
                                            readonly type: "string";
                                        }, {
                                            readonly type: "null";
                                        }];
                                    };
                                    readonly meeting_url: {
                                        readonly anyOf: readonly [{
                                            readonly type: "string";
                                        }, {
                                            readonly type: "null";
                                        }];
                                    };
                                    readonly cover_url: {
                                        readonly type: "string";
                                    };
                                    readonly registration_questions: {
                                        readonly type: "array";
                                        readonly items: {
                                            readonly anyOf: readonly [{
                                                readonly type: "object";
                                                readonly properties: {
                                                    readonly id: {
                                                        readonly type: "string";
                                                    };
                                                    readonly label: {
                                                        readonly type: "string";
                                                    };
                                                    readonly required: {
                                                        readonly type: "boolean";
                                                    };
                                                    readonly question_type: {
                                                        readonly type: "string";
                                                        readonly const: "agree-check";
                                                    };
                                                };
                                                readonly required: readonly ["id", "label", "required", "question_type"];
                                            }, {
                                                readonly type: "object";
                                                readonly properties: {
                                                    readonly id: {
                                                        readonly type: "string";
                                                    };
                                                    readonly label: {
                                                        readonly type: "string";
                                                    };
                                                    readonly required: {
                                                        readonly type: "boolean";
                                                    };
                                                    readonly question_type: {
                                                        readonly type: "string";
                                                        readonly const: "company";
                                                    };
                                                    readonly collect_job_title: {
                                                        readonly type: "boolean";
                                                    };
                                                    readonly job_title_label: {
                                                        readonly type: "string";
                                                    };
                                                };
                                                readonly required: readonly ["id", "label", "required", "question_type"];
                                            }, {
                                                readonly type: "object";
                                                readonly properties: {
                                                    readonly id: {
                                                        readonly type: "string";
                                                    };
                                                    readonly label: {
                                                        readonly type: "string";
                                                    };
                                                    readonly required: {
                                                        readonly type: "boolean";
                                                    };
                                                    readonly question_type: {
                                                        readonly type: "string";
                                                        readonly const: "dropdown";
                                                    };
                                                    readonly options: {
                                                        readonly maxItems: 250;
                                                        readonly type: "array";
                                                        readonly items: {
                                                            readonly type: "string";
                                                        };
                                                    };
                                                };
                                                readonly required: readonly ["id", "label", "required", "question_type", "options"];
                                            }, {
                                                readonly type: "object";
                                                readonly properties: {
                                                    readonly id: {
                                                        readonly type: "string";
                                                    };
                                                    readonly label: {
                                                        readonly type: "string";
                                                    };
                                                    readonly required: {
                                                        readonly type: "boolean";
                                                    };
                                                    readonly question_type: {
                                                        readonly type: "string";
                                                        readonly const: "github";
                                                    };
                                                };
                                                readonly required: readonly ["id", "label", "required", "question_type"];
                                            }, {
                                                readonly type: "object";
                                                readonly properties: {
                                                    readonly id: {
                                                        readonly type: "string";
                                                    };
                                                    readonly label: {
                                                        readonly type: "string";
                                                    };
                                                    readonly required: {
                                                        readonly type: "boolean";
                                                    };
                                                    readonly question_type: {
                                                        readonly type: "string";
                                                        readonly const: "instagram";
                                                    };
                                                };
                                                readonly required: readonly ["id", "label", "required", "question_type"];
                                            }, {
                                                readonly type: "object";
                                                readonly properties: {
                                                    readonly id: {
                                                        readonly type: "string";
                                                    };
                                                    readonly label: {
                                                        readonly type: "string";
                                                    };
                                                    readonly required: {
                                                        readonly type: "boolean";
                                                    };
                                                    readonly question_type: {
                                                        readonly type: "string";
                                                        readonly const: "linkedin";
                                                    };
                                                };
                                                readonly required: readonly ["id", "label", "required", "question_type"];
                                            }, {
                                                readonly type: "object";
                                                readonly properties: {
                                                    readonly id: {
                                                        readonly type: "string";
                                                    };
                                                    readonly label: {
                                                        readonly type: "string";
                                                    };
                                                    readonly required: {
                                                        readonly type: "boolean";
                                                    };
                                                    readonly question_type: {
                                                        readonly type: "string";
                                                        readonly const: "long-text";
                                                    };
                                                };
                                                readonly required: readonly ["id", "label", "required", "question_type"];
                                            }, {
                                                readonly type: "object";
                                                readonly properties: {
                                                    readonly id: {
                                                        readonly type: "string";
                                                    };
                                                    readonly label: {
                                                        readonly type: "string";
                                                    };
                                                    readonly required: {
                                                        readonly type: "boolean";
                                                    };
                                                    readonly question_type: {
                                                        readonly type: "string";
                                                        readonly const: "multi-select";
                                                    };
                                                    readonly options: {
                                                        readonly maxItems: 250;
                                                        readonly type: "array";
                                                        readonly items: {
                                                            readonly type: "string";
                                                        };
                                                    };
                                                };
                                                readonly required: readonly ["id", "label", "required", "question_type", "options"];
                                            }, {
                                                readonly type: "object";
                                                readonly properties: {
                                                    readonly id: {
                                                        readonly type: "string";
                                                    };
                                                    readonly label: {
                                                        readonly type: "string";
                                                    };
                                                    readonly required: {
                                                        readonly type: "boolean";
                                                    };
                                                    readonly question_type: {
                                                        readonly type: "string";
                                                        readonly const: "phone-number";
                                                    };
                                                };
                                                readonly required: readonly ["id", "label", "required", "question_type"];
                                            }, {
                                                readonly type: "object";
                                                readonly properties: {
                                                    readonly id: {
                                                        readonly type: "string";
                                                    };
                                                    readonly label: {
                                                        readonly type: "string";
                                                    };
                                                    readonly required: {
                                                        readonly type: "boolean";
                                                    };
                                                    readonly question_type: {
                                                        readonly type: "string";
                                                        readonly const: "telegram";
                                                    };
                                                };
                                                readonly required: readonly ["id", "label", "required", "question_type"];
                                            }, {
                                                readonly type: "object";
                                                readonly properties: {
                                                    readonly id: {
                                                        readonly type: "string";
                                                    };
                                                    readonly label: {
                                                        readonly type: "string";
                                                    };
                                                    readonly required: {
                                                        readonly type: "boolean";
                                                    };
                                                    readonly question_type: {
                                                        readonly type: "string";
                                                        readonly const: "twitter";
                                                    };
                                                };
                                                readonly required: readonly ["id", "label", "required", "question_type"];
                                            }, {
                                                readonly type: "object";
                                                readonly properties: {
                                                    readonly id: {
                                                        readonly type: "string";
                                                    };
                                                    readonly label: {
                                                        readonly type: "string";
                                                    };
                                                    readonly required: {
                                                        readonly type: "boolean";
                                                    };
                                                    readonly question_type: {
                                                        readonly type: "string";
                                                        readonly const: "text";
                                                    };
                                                };
                                                readonly required: readonly ["id", "label", "required", "question_type"];
                                            }, {
                                                readonly type: "object";
                                                readonly properties: {
                                                    readonly id: {
                                                        readonly type: "string";
                                                    };
                                                    readonly label: {
                                                        readonly type: "string";
                                                    };
                                                    readonly required: {
                                                        readonly type: "boolean";
                                                    };
                                                    readonly question_type: {
                                                        readonly type: "string";
                                                        readonly const: "url";
                                                    };
                                                };
                                                readonly required: readonly ["id", "label", "required", "question_type"];
                                            }, {
                                                readonly type: "object";
                                                readonly properties: {
                                                    readonly id: {
                                                        readonly type: "string";
                                                    };
                                                    readonly label: {
                                                        readonly type: "string";
                                                    };
                                                    readonly required: {
                                                        readonly type: "boolean";
                                                    };
                                                    readonly question_type: {
                                                        readonly type: "string";
                                                        readonly const: "youtube";
                                                    };
                                                };
                                                readonly required: readonly ["id", "label", "required", "question_type"];
                                            }];
                                        };
                                    };
                                    readonly url: {
                                        readonly type: "string";
                                    };
                                    readonly visibility: {
                                        readonly type: "string";
                                        readonly enum: readonly ["public", "members-only", "private"];
                                        readonly description: "`public` `members-only` `private`";
                                    };
                                    readonly api_id: {
                                        readonly deprecated: true;
                                        readonly type: "string";
                                    };
                                    readonly user_api_id: {
                                        readonly deprecated: true;
                                        readonly type: "string";
                                    };
                                    readonly calendar_api_id: {
                                        readonly deprecated: true;
                                        readonly type: "string";
                                    };
                                    readonly zoom_meeting_url: {
                                        readonly deprecated: true;
                                        readonly anyOf: readonly [{
                                            readonly type: "string";
                                        }, {
                                            readonly type: "null";
                                        }];
                                    };
                                };
                                readonly required: readonly ["id", "user_id", "calendar_id", "start_at", "duration_interval", "end_at", "created_at", "timezone", "name", "description", "description_md", "geo_address_json", "geo_latitude", "geo_longitude", "meeting_url", "cover_url", "url", "visibility", "api_id", "user_api_id", "calendar_api_id", "zoom_meeting_url"];
                            };
                            readonly tags: {
                                readonly type: "array";
                                readonly items: {
                                    readonly type: "object";
                                    readonly properties: {
                                        readonly id: {
                                            readonly type: "string";
                                        };
                                        readonly name: {
                                            readonly type: "string";
                                        };
                                        readonly api_id: {
                                            readonly deprecated: true;
                                            readonly type: "string";
                                        };
                                    };
                                    readonly required: readonly ["id", "name", "api_id"];
                                };
                            };
                        };
                        readonly required: readonly ["api_id", "event", "tags"];
                    };
                };
                readonly has_more: {
                    readonly type: "boolean";
                };
                readonly next_cursor: {
                    readonly type: "string";
                };
            };
            readonly required: readonly ["entries", "has_more"];
        };
    };
};
declare const GetV1CalendarListPeople: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly query: {
                    readonly description: "Search over names and emails.";
                    readonly anyOf: readonly [{
                        readonly type: "string";
                    }, {
                        readonly type: "null";
                    }];
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
                readonly tags: {
                    readonly description: "Comma-separated list of tag names or tag IDs to filter people. Returns people who have any of the specified tags.";
                    readonly anyOf: readonly [{
                        readonly type: "string";
                    }, {
                        readonly type: "null";
                    }];
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
                readonly calendar_membership_tier_id: {
                    readonly anyOf: readonly [{
                        readonly type: "string";
                    }, {
                        readonly type: "null";
                    }];
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
                readonly member_status: {
                    readonly description: "This is relevant for Calendar Memberships but not relevant otherwise.";
                    readonly anyOf: readonly [{
                        readonly type: "string";
                        readonly enum: readonly ["approved", "pending", "declined"];
                    }, {
                        readonly type: "null";
                    }];
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
                readonly pagination_cursor: {
                    readonly description: "Value of `next_cursor` from a previous request.";
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
                readonly pagination_limit: {
                    readonly description: "The number of items to return. The server will enforce a maximum number.";
                    readonly type: "number";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
                readonly sort_column: {
                    readonly type: "string";
                    readonly enum: readonly ["created_at", "event_checked_in_count", "event_approved_count", "name", "revenue_usd_cents"];
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
                readonly sort_direction: {
                    readonly type: "string";
                    readonly enum: readonly ["asc", "desc", "asc nulls last", "desc nulls last"];
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
                readonly calendar_membership_tier_api_id: {
                    readonly anyOf: readonly [{
                        readonly deprecated: true;
                        readonly type: "string";
                    }, {
                        readonly type: "null";
                    }];
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
            };
            readonly required: readonly [];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly $schema: "https://json-schema.org/draft/2020-12/schema";
            readonly type: "object";
            readonly properties: {
                readonly entries: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly id: {
                                readonly type: "string";
                            };
                            readonly email: {
                                readonly type: "string";
                            };
                            readonly created_at: {
                                readonly description: "ISO 8601 Datetime. For example, 2022-10-19T03:27:13.673Z";
                                readonly type: "string";
                                readonly format: "date-time";
                                readonly pattern: "^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d+)?)?(?:Z|([+-](?:[01]\\d|2[0-3]):[0-5]\\d)))$";
                            };
                            readonly event_approved_count: {
                                readonly type: "number";
                            };
                            readonly event_checked_in_count: {
                                readonly type: "number";
                            };
                            readonly revenue_usd_cents: {
                                readonly type: "number";
                            };
                            readonly tags: {
                                readonly type: "array";
                                readonly items: {
                                    readonly type: "object";
                                    readonly properties: {
                                        readonly id: {
                                            readonly type: "string";
                                        };
                                        readonly name: {
                                            readonly type: "string";
                                        };
                                        readonly api_id: {
                                            readonly deprecated: true;
                                            readonly type: "string";
                                        };
                                    };
                                    readonly required: readonly ["id", "name", "api_id"];
                                };
                            };
                            readonly user: {
                                readonly type: "object";
                                readonly properties: {
                                    readonly id: {
                                        readonly type: "string";
                                    };
                                    readonly name: {
                                        readonly anyOf: readonly [{
                                            readonly type: "string";
                                        }, {
                                            readonly type: "null";
                                        }];
                                    };
                                    readonly avatar_url: {
                                        readonly type: "string";
                                    };
                                    readonly email: {
                                        readonly type: "string";
                                    };
                                    readonly first_name: {
                                        readonly anyOf: readonly [{
                                            readonly type: "string";
                                        }, {
                                            readonly type: "null";
                                        }];
                                    };
                                    readonly last_name: {
                                        readonly anyOf: readonly [{
                                            readonly type: "string";
                                        }, {
                                            readonly type: "null";
                                        }];
                                    };
                                    readonly api_id: {
                                        readonly deprecated: true;
                                        readonly type: "string";
                                    };
                                };
                                readonly required: readonly ["id", "name", "avatar_url", "email", "first_name", "last_name", "api_id"];
                            };
                            readonly membership: {
                                readonly anyOf: readonly [{
                                    readonly type: "object";
                                    readonly properties: {
                                        readonly status: {
                                            readonly type: "string";
                                            readonly enum: readonly ["approved", "pending", "declined"];
                                            readonly description: "`approved` `pending` `declined`";
                                        };
                                        readonly calendar_membership_tier_id: {
                                            readonly anyOf: readonly [{
                                                readonly type: "string";
                                            }, {
                                                readonly type: "null";
                                            }];
                                        };
                                    };
                                    readonly required: readonly ["status", "calendar_membership_tier_id"];
                                }, {
                                    readonly type: "null";
                                }];
                            };
                            readonly api_id: {
                                readonly deprecated: true;
                                readonly type: "string";
                            };
                        };
                        readonly required: readonly ["id", "email", "created_at", "event_approved_count", "event_checked_in_count", "revenue_usd_cents", "tags", "user", "membership", "api_id"];
                    };
                };
                readonly has_more: {
                    readonly type: "boolean";
                };
                readonly next_cursor: {
                    readonly type: "string";
                };
            };
            readonly required: readonly ["entries", "has_more"];
        };
    };
};
declare const GetV1CalendarListPersonTags: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly pagination_cursor: {
                    readonly description: "Value of `next_cursor` from a previous request.";
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
                readonly pagination_limit: {
                    readonly description: "The number of items to return. The server will enforce a maximum number.";
                    readonly type: "number";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
                readonly sort_column: {
                    readonly type: "string";
                    readonly enum: readonly ["name", "color", "created_at"];
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
                readonly sort_direction: {
                    readonly type: "string";
                    readonly enum: readonly ["asc", "desc", "asc nulls last", "desc nulls last"];
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
            };
            readonly required: readonly [];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly $schema: "https://json-schema.org/draft/2020-12/schema";
            readonly type: "object";
            readonly properties: {
                readonly entries: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly api_id: {
                                readonly type: "string";
                            };
                            readonly name: {
                                readonly type: "string";
                            };
                            readonly color: {
                                readonly type: "string";
                            };
                            readonly created_at: {
                                readonly description: "ISO 8601 Datetime. For example, 2022-10-19T03:27:13.673Z";
                                readonly type: "string";
                                readonly format: "date-time";
                                readonly pattern: "^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d+)?)?(?:Z|([+-](?:[01]\\d|2[0-3]):[0-5]\\d)))$";
                            };
                        };
                        readonly required: readonly ["api_id", "name", "color", "created_at"];
                    };
                };
                readonly has_more: {
                    readonly type: "boolean";
                };
                readonly next_cursor: {
                    readonly type: "string";
                };
            };
            readonly required: readonly ["entries", "has_more"];
        };
    };
};
declare const GetV1CalendarLookupEvent: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly platform: {
                    readonly type: "string";
                    readonly enum: readonly ["external", "luma"];
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
                readonly url: {
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
                readonly event_api_id: {
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
            };
            readonly required: readonly [];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly $schema: "https://json-schema.org/draft/2020-12/schema";
            readonly type: "object";
            readonly properties: {
                readonly event: {
                    readonly anyOf: readonly [{
                        readonly type: "object";
                        readonly properties: {
                            readonly api_id: {
                                readonly type: "string";
                            };
                            readonly status: {
                                readonly type: "string";
                                readonly enum: readonly ["approved", "pending", "rejected"];
                                readonly description: "`approved` `pending` `rejected`";
                            };
                        };
                        readonly required: readonly ["api_id", "status"];
                    }, {
                        readonly type: "null";
                    }];
                };
            };
            readonly required: readonly ["event"];
        };
    };
};
declare const GetV1EntityLookup: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly slug: {
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
            };
            readonly required: readonly ["slug"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly $schema: "https://json-schema.org/draft/2020-12/schema";
            readonly type: "object";
            readonly properties: {
                readonly entity: {
                    readonly anyOf: readonly [{
                        readonly anyOf: readonly [{
                            readonly type: "object";
                            readonly properties: {
                                readonly type: {
                                    readonly type: "string";
                                    readonly const: "calendar";
                                };
                                readonly calendar: {
                                    readonly type: "object";
                                    readonly properties: {
                                        readonly api_id: {
                                            readonly type: "string";
                                        };
                                        readonly name: {
                                            readonly type: "string";
                                        };
                                        readonly slug: {
                                            readonly anyOf: readonly [{
                                                readonly type: "string";
                                            }, {
                                                readonly type: "null";
                                            }];
                                        };
                                        readonly avatar_url: {
                                            readonly anyOf: readonly [{
                                                readonly type: "string";
                                            }, {
                                                readonly type: "null";
                                            }];
                                        };
                                    };
                                    readonly required: readonly ["api_id", "name", "slug"];
                                };
                            };
                            readonly required: readonly ["type", "calendar"];
                        }, {
                            readonly type: "object";
                            readonly properties: {
                                readonly type: {
                                    readonly type: "string";
                                    readonly const: "event";
                                };
                                readonly event: {
                                    readonly type: "object";
                                    readonly properties: {
                                        readonly api_id: {
                                            readonly type: "string";
                                        };
                                        readonly name: {
                                            readonly type: "string";
                                        };
                                        readonly slug: {
                                            readonly type: "string";
                                        };
                                        readonly cover_url: {
                                            readonly type: "string";
                                        };
                                        readonly start_at: {
                                            readonly description: "ISO 8601 Datetime. For example, 2022-10-19T03:27:13.673Z";
                                            readonly type: "string";
                                            readonly format: "date-time";
                                            readonly pattern: "^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d+)?)?(?:Z|([+-](?:[01]\\d|2[0-3]):[0-5]\\d)))$";
                                        };
                                        readonly end_at: {
                                            readonly description: "ISO 8601 Datetime. For example, 2022-10-19T03:27:13.673Z";
                                            readonly type: "string";
                                            readonly format: "date-time";
                                            readonly pattern: "^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d+)?)?(?:Z|([+-](?:[01]\\d|2[0-3]):[0-5]\\d)))$";
                                        };
                                    };
                                    readonly required: readonly ["api_id", "name", "slug", "cover_url", "start_at", "end_at"];
                                };
                            };
                            readonly required: readonly ["type", "event"];
                        }];
                    }, {
                        readonly type: "null";
                    }];
                };
            };
            readonly required: readonly ["entity"];
        };
    };
};
declare const GetV1EventCoupons: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly event_id: {
                    readonly description: "Event ID, this usually starts with evt-";
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
                readonly pagination_cursor: {
                    readonly description: "Value of `next_cursor` from a previous request.";
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
                readonly pagination_limit: {
                    readonly description: "The number of items to return. The server will enforce a maximum number.";
                    readonly type: "number";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
                readonly event_api_id: {
                    readonly deprecated: true;
                    readonly description: "Event API ID, this usually starts with evt-";
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
            };
            readonly required: readonly [];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly $schema: "https://json-schema.org/draft/2020-12/schema";
            readonly type: "object";
            readonly properties: {
                readonly entries: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly api_id: {
                                readonly type: "string";
                            };
                            readonly code: {
                                readonly description: "This code is case insensitive.";
                                readonly type: "string";
                            };
                            readonly remaining_count: {
                                readonly type: "integer";
                                readonly minimum: -9007199254740991;
                                readonly maximum: 9007199254740991;
                            };
                            readonly valid_start_at: {
                                readonly anyOf: readonly [{
                                    readonly description: "ISO 8601 Datetime. For example, 2022-10-19T03:27:13.673Z";
                                    readonly type: "string";
                                    readonly format: "date-time";
                                    readonly pattern: "^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d+)?)?(?:Z|([+-](?:[01]\\d|2[0-3]):[0-5]\\d)))$";
                                }, {
                                    readonly type: "null";
                                }];
                            };
                            readonly valid_end_at: {
                                readonly anyOf: readonly [{
                                    readonly description: "ISO 8601 Datetime. For example, 2022-10-19T03:27:13.673Z";
                                    readonly type: "string";
                                    readonly format: "date-time";
                                    readonly pattern: "^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d+)?)?(?:Z|([+-](?:[01]\\d|2[0-3]):[0-5]\\d)))$";
                                }, {
                                    readonly type: "null";
                                }];
                            };
                            readonly percent_off: {
                                readonly anyOf: readonly [{
                                    readonly type: "number";
                                }, {
                                    readonly type: "null";
                                }];
                            };
                            readonly cents_off: {
                                readonly anyOf: readonly [{
                                    readonly type: "number";
                                }, {
                                    readonly type: "null";
                                }];
                            };
                            readonly currency: {
                                readonly anyOf: readonly [{
                                    readonly type: "string";
                                    readonly enum: readonly ["solana_sol", "solana_usdc", "aed", "afn", "all", "amd", "ang", "aoa", "ars", "aud", "awg", "azn", "bam", "bbd", "bdt", "bgn", "bhd", "bif", "bmd", "bnd", "bob", "brl", "bsd", "bwp", "byn", "bzd", "cad", "cdf", "chf", "clp", "cny", "cop", "crc", "cve", "czk", "djf", "dkk", "dop", "dzd", "egp", "etb", "eur", "fjd", "fkp", "gbp", "gel", "ghs", "gip", "gmd", "gnf", "gtq", "gyd", "hkd", "hnl", "htg", "huf", "idr", "ils", "inr", "isk", "jmd", "jod", "jpy", "kes", "kgs", "khr", "kmf", "krw", "kwd", "kyd", "kzt", "lak", "lbp", "lkr", "lrd", "lsl", "mad", "mdl", "mga", "mkd", "mmk", "mnt", "mop", "mur", "mvr", "mwk", "mxn", "myr", "mzn", "nad", "ngn", "nio", "nok", "npr", "nzd", "omr", "pab", "pen", "pgk", "php", "pkr", "pln", "pyg", "qar", "ron", "rsd", "rub", "rwf", "sar", "sbd", "scr", "sek", "sgd", "shp", "sle", "sos", "srd", "std", "szl", "thb", "tjs", "tnd", "top", "try", "ttd", "twd", "tzs", "uah", "ugx", "usd", "uyu", "uzs", "vnd", "vuv", "wst", "xaf", "xcd", "xof", "xpf", "yer", "zar", "zmw"];
                                    readonly description: "`solana_sol` `solana_usdc` `aed` `afn` `all` `amd` `ang` `aoa` `ars` `aud` `awg` `azn` `bam` `bbd` `bdt` `bgn` `bhd` `bif` `bmd` `bnd` `bob` `brl` `bsd` `bwp` `byn` `bzd` `cad` `cdf` `chf` `clp` `cny` `cop` `crc` `cve` `czk` `djf` `dkk` `dop` `dzd` `egp` `etb` `eur` `fjd` `fkp` `gbp` `gel` `ghs` `gip` `gmd` `gnf` `gtq` `gyd` `hkd` `hnl` `htg` `huf` `idr` `ils` `inr` `isk` `jmd` `jod` `jpy` `kes` `kgs` `khr` `kmf` `krw` `kwd` `kyd` `kzt` `lak` `lbp` `lkr` `lrd` `lsl` `mad` `mdl` `mga` `mkd` `mmk` `mnt` `mop` `mur` `mvr` `mwk` `mxn` `myr` `mzn` `nad` `ngn` `nio` `nok` `npr` `nzd` `omr` `pab` `pen` `pgk` `php` `pkr` `pln` `pyg` `qar` `ron` `rsd` `rub` `rwf` `sar` `sbd` `scr` `sek` `sgd` `shp` `sle` `sos` `srd` `std` `szl` `thb` `tjs` `tnd` `top` `try` `ttd` `twd` `tzs` `uah` `ugx` `usd` `uyu` `uzs` `vnd` `vuv` `wst` `xaf` `xcd` `xof` `xpf` `yer` `zar` `zmw`";
                                }, {
                                    readonly type: "null";
                                }];
                            };
                        };
                        readonly required: readonly ["api_id", "code", "remaining_count", "valid_start_at", "valid_end_at", "percent_off", "cents_off", "currency"];
                    };
                };
                readonly has_more: {
                    readonly type: "boolean";
                };
                readonly next_cursor: {
                    readonly type: "string";
                };
            };
            readonly required: readonly ["entries", "has_more"];
        };
    };
};
declare const GetV1EventGet: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly id: {
                    readonly description: "Event ID, this usually starts with evt-";
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
                readonly api_id: {
                    readonly deprecated: true;
                    readonly description: "Deprecated: use `id` instead.";
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
            };
            readonly required: readonly [];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly $schema: "https://json-schema.org/draft/2020-12/schema";
            readonly type: "object";
            readonly properties: {
                readonly event: {
                    readonly type: "object";
                    readonly properties: {
                        readonly id: {
                            readonly type: "string";
                        };
                        readonly user_id: {
                            readonly type: "string";
                        };
                        readonly calendar_id: {
                            readonly type: "string";
                        };
                        readonly start_at: {
                            readonly description: "ISO 8601 Datetime. For example, 2022-10-19T03:27:13.673Z";
                            readonly type: "string";
                            readonly format: "date-time";
                            readonly pattern: "^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d+)?)?(?:Z|([+-](?:[01]\\d|2[0-3]):[0-5]\\d)))$";
                        };
                        readonly duration_interval: {
                            readonly type: "string";
                        };
                        readonly end_at: {
                            readonly description: "ISO 8601 Datetime. For example, 2022-10-19T03:27:13.673Z";
                            readonly type: "string";
                            readonly format: "date-time";
                            readonly pattern: "^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d+)?)?(?:Z|([+-](?:[01]\\d|2[0-3]):[0-5]\\d)))$";
                        };
                        readonly created_at: {
                            readonly description: "ISO 8601 Datetime. For example, 2022-10-19T03:27:13.673Z";
                            readonly type: "string";
                            readonly format: "date-time";
                            readonly pattern: "^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d+)?)?(?:Z|([+-](?:[01]\\d|2[0-3]):[0-5]\\d)))$";
                        };
                        readonly timezone: {
                            readonly description: "IANA Timezone, e.g. America/New_York. https://en.wikipedia.org/wiki/List_of_tz_database_time_zones";
                            readonly type: "string";
                        };
                        readonly name: {
                            readonly type: "string";
                        };
                        readonly description: {
                            readonly type: "string";
                        };
                        readonly description_md: {
                            readonly type: "string";
                        };
                        readonly geo_address_json: {
                            readonly anyOf: readonly [{
                                readonly type: "object";
                                readonly properties: {
                                    readonly address: {
                                        readonly type: "string";
                                    };
                                    readonly city: {
                                        readonly anyOf: readonly [{
                                            readonly type: "string";
                                        }, {
                                            readonly type: "null";
                                        }];
                                    };
                                    readonly region: {
                                        readonly anyOf: readonly [{
                                            readonly type: "string";
                                        }, {
                                            readonly type: "null";
                                        }];
                                    };
                                    readonly country: {
                                        readonly anyOf: readonly [{
                                            readonly type: "string";
                                        }, {
                                            readonly type: "null";
                                        }];
                                    };
                                    readonly city_state: {
                                        readonly anyOf: readonly [{
                                            readonly type: "string";
                                        }, {
                                            readonly type: "null";
                                        }];
                                    };
                                    readonly full_address: {
                                        readonly anyOf: readonly [{
                                            readonly type: "string";
                                        }, {
                                            readonly type: "null";
                                        }];
                                    };
                                    readonly google_maps_place_id: {
                                        readonly anyOf: readonly [{
                                            readonly type: "string";
                                        }, {
                                            readonly type: "null";
                                        }];
                                    };
                                    readonly apple_maps_place_id: {
                                        readonly anyOf: readonly [{
                                            readonly type: "string";
                                        }, {
                                            readonly type: "null";
                                        }];
                                    };
                                    readonly description: {
                                        readonly anyOf: readonly [{
                                            readonly type: "string";
                                        }, {
                                            readonly type: "null";
                                        }];
                                    };
                                };
                                readonly required: readonly ["address", "city", "region", "country", "city_state", "full_address", "google_maps_place_id", "apple_maps_place_id", "description"];
                            }, {
                                readonly type: "null";
                            }];
                        };
                        readonly geo_latitude: {
                            readonly anyOf: readonly [{
                                readonly type: "string";
                            }, {
                                readonly type: "null";
                            }];
                        };
                        readonly geo_longitude: {
                            readonly anyOf: readonly [{
                                readonly type: "string";
                            }, {
                                readonly type: "null";
                            }];
                        };
                        readonly meeting_url: {
                            readonly anyOf: readonly [{
                                readonly type: "string";
                            }, {
                                readonly type: "null";
                            }];
                        };
                        readonly cover_url: {
                            readonly type: "string";
                        };
                        readonly registration_questions: {
                            readonly type: "array";
                            readonly items: {
                                readonly anyOf: readonly [{
                                    readonly type: "object";
                                    readonly properties: {
                                        readonly id: {
                                            readonly type: "string";
                                        };
                                        readonly label: {
                                            readonly type: "string";
                                        };
                                        readonly required: {
                                            readonly type: "boolean";
                                        };
                                        readonly question_type: {
                                            readonly type: "string";
                                            readonly const: "agree-check";
                                        };
                                    };
                                    readonly required: readonly ["id", "label", "required", "question_type"];
                                }, {
                                    readonly type: "object";
                                    readonly properties: {
                                        readonly id: {
                                            readonly type: "string";
                                        };
                                        readonly label: {
                                            readonly type: "string";
                                        };
                                        readonly required: {
                                            readonly type: "boolean";
                                        };
                                        readonly question_type: {
                                            readonly type: "string";
                                            readonly const: "company";
                                        };
                                        readonly collect_job_title: {
                                            readonly type: "boolean";
                                        };
                                        readonly job_title_label: {
                                            readonly type: "string";
                                        };
                                    };
                                    readonly required: readonly ["id", "label", "required", "question_type"];
                                }, {
                                    readonly type: "object";
                                    readonly properties: {
                                        readonly id: {
                                            readonly type: "string";
                                        };
                                        readonly label: {
                                            readonly type: "string";
                                        };
                                        readonly required: {
                                            readonly type: "boolean";
                                        };
                                        readonly question_type: {
                                            readonly type: "string";
                                            readonly const: "dropdown";
                                        };
                                        readonly options: {
                                            readonly maxItems: 250;
                                            readonly type: "array";
                                            readonly items: {
                                                readonly type: "string";
                                            };
                                        };
                                    };
                                    readonly required: readonly ["id", "label", "required", "question_type", "options"];
                                }, {
                                    readonly type: "object";
                                    readonly properties: {
                                        readonly id: {
                                            readonly type: "string";
                                        };
                                        readonly label: {
                                            readonly type: "string";
                                        };
                                        readonly required: {
                                            readonly type: "boolean";
                                        };
                                        readonly question_type: {
                                            readonly type: "string";
                                            readonly const: "github";
                                        };
                                    };
                                    readonly required: readonly ["id", "label", "required", "question_type"];
                                }, {
                                    readonly type: "object";
                                    readonly properties: {
                                        readonly id: {
                                            readonly type: "string";
                                        };
                                        readonly label: {
                                            readonly type: "string";
                                        };
                                        readonly required: {
                                            readonly type: "boolean";
                                        };
                                        readonly question_type: {
                                            readonly type: "string";
                                            readonly const: "instagram";
                                        };
                                    };
                                    readonly required: readonly ["id", "label", "required", "question_type"];
                                }, {
                                    readonly type: "object";
                                    readonly properties: {
                                        readonly id: {
                                            readonly type: "string";
                                        };
                                        readonly label: {
                                            readonly type: "string";
                                        };
                                        readonly required: {
                                            readonly type: "boolean";
                                        };
                                        readonly question_type: {
                                            readonly type: "string";
                                            readonly const: "linkedin";
                                        };
                                    };
                                    readonly required: readonly ["id", "label", "required", "question_type"];
                                }, {
                                    readonly type: "object";
                                    readonly properties: {
                                        readonly id: {
                                            readonly type: "string";
                                        };
                                        readonly label: {
                                            readonly type: "string";
                                        };
                                        readonly required: {
                                            readonly type: "boolean";
                                        };
                                        readonly question_type: {
                                            readonly type: "string";
                                            readonly const: "long-text";
                                        };
                                    };
                                    readonly required: readonly ["id", "label", "required", "question_type"];
                                }, {
                                    readonly type: "object";
                                    readonly properties: {
                                        readonly id: {
                                            readonly type: "string";
                                        };
                                        readonly label: {
                                            readonly type: "string";
                                        };
                                        readonly required: {
                                            readonly type: "boolean";
                                        };
                                        readonly question_type: {
                                            readonly type: "string";
                                            readonly const: "multi-select";
                                        };
                                        readonly options: {
                                            readonly maxItems: 250;
                                            readonly type: "array";
                                            readonly items: {
                                                readonly type: "string";
                                            };
                                        };
                                    };
                                    readonly required: readonly ["id", "label", "required", "question_type", "options"];
                                }, {
                                    readonly type: "object";
                                    readonly properties: {
                                        readonly id: {
                                            readonly type: "string";
                                        };
                                        readonly label: {
                                            readonly type: "string";
                                        };
                                        readonly required: {
                                            readonly type: "boolean";
                                        };
                                        readonly question_type: {
                                            readonly type: "string";
                                            readonly const: "phone-number";
                                        };
                                    };
                                    readonly required: readonly ["id", "label", "required", "question_type"];
                                }, {
                                    readonly type: "object";
                                    readonly properties: {
                                        readonly id: {
                                            readonly type: "string";
                                        };
                                        readonly label: {
                                            readonly type: "string";
                                        };
                                        readonly required: {
                                            readonly type: "boolean";
                                        };
                                        readonly question_type: {
                                            readonly type: "string";
                                            readonly const: "telegram";
                                        };
                                    };
                                    readonly required: readonly ["id", "label", "required", "question_type"];
                                }, {
                                    readonly type: "object";
                                    readonly properties: {
                                        readonly id: {
                                            readonly type: "string";
                                        };
                                        readonly label: {
                                            readonly type: "string";
                                        };
                                        readonly required: {
                                            readonly type: "boolean";
                                        };
                                        readonly question_type: {
                                            readonly type: "string";
                                            readonly const: "twitter";
                                        };
                                    };
                                    readonly required: readonly ["id", "label", "required", "question_type"];
                                }, {
                                    readonly type: "object";
                                    readonly properties: {
                                        readonly id: {
                                            readonly type: "string";
                                        };
                                        readonly label: {
                                            readonly type: "string";
                                        };
                                        readonly required: {
                                            readonly type: "boolean";
                                        };
                                        readonly question_type: {
                                            readonly type: "string";
                                            readonly const: "text";
                                        };
                                    };
                                    readonly required: readonly ["id", "label", "required", "question_type"];
                                }, {
                                    readonly type: "object";
                                    readonly properties: {
                                        readonly id: {
                                            readonly type: "string";
                                        };
                                        readonly label: {
                                            readonly type: "string";
                                        };
                                        readonly required: {
                                            readonly type: "boolean";
                                        };
                                        readonly question_type: {
                                            readonly type: "string";
                                            readonly const: "url";
                                        };
                                    };
                                    readonly required: readonly ["id", "label", "required", "question_type"];
                                }, {
                                    readonly type: "object";
                                    readonly properties: {
                                        readonly id: {
                                            readonly type: "string";
                                        };
                                        readonly label: {
                                            readonly type: "string";
                                        };
                                        readonly required: {
                                            readonly type: "boolean";
                                        };
                                        readonly question_type: {
                                            readonly type: "string";
                                            readonly const: "youtube";
                                        };
                                    };
                                    readonly required: readonly ["id", "label", "required", "question_type"];
                                }];
                            };
                        };
                        readonly url: {
                            readonly type: "string";
                        };
                        readonly visibility: {
                            readonly type: "string";
                            readonly enum: readonly ["public", "members-only", "private"];
                            readonly description: "`public` `members-only` `private`";
                        };
                        readonly api_id: {
                            readonly deprecated: true;
                            readonly type: "string";
                        };
                        readonly user_api_id: {
                            readonly deprecated: true;
                            readonly type: "string";
                        };
                        readonly calendar_api_id: {
                            readonly deprecated: true;
                            readonly type: "string";
                        };
                        readonly zoom_meeting_url: {
                            readonly deprecated: true;
                            readonly anyOf: readonly [{
                                readonly type: "string";
                            }, {
                                readonly type: "null";
                            }];
                        };
                    };
                    readonly required: readonly ["id", "user_id", "calendar_id", "start_at", "duration_interval", "end_at", "created_at", "timezone", "name", "description", "description_md", "geo_address_json", "geo_latitude", "geo_longitude", "meeting_url", "cover_url", "url", "visibility", "api_id", "user_api_id", "calendar_api_id", "zoom_meeting_url"];
                };
                readonly hosts: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly id: {
                                readonly type: "string";
                            };
                            readonly email: {
                                readonly type: "string";
                            };
                            readonly name: {
                                readonly anyOf: readonly [{
                                    readonly type: "string";
                                }, {
                                    readonly type: "null";
                                }];
                            };
                            readonly first_name: {
                                readonly anyOf: readonly [{
                                    readonly type: "string";
                                }, {
                                    readonly type: "null";
                                }];
                            };
                            readonly last_name: {
                                readonly anyOf: readonly [{
                                    readonly type: "string";
                                }, {
                                    readonly type: "null";
                                }];
                            };
                            readonly avatar_url: {
                                readonly type: "string";
                            };
                            readonly api_id: {
                                readonly deprecated: true;
                                readonly type: "string";
                            };
                        };
                        readonly required: readonly ["id", "email", "name", "first_name", "last_name", "avatar_url", "api_id"];
                    };
                };
            };
            readonly required: readonly ["event", "hosts"];
        };
    };
};
declare const GetV1EventGetGuest: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly event_id: {
                    readonly description: "Event ID, this usually starts with evt-";
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
                readonly id: {
                    readonly description: "You can choose from a few different identifiers here including guest ID (gst-), ticket key, guest key (g-), or the user's email.";
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
                readonly event_api_id: {
                    readonly deprecated: true;
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
                readonly api_id: {
                    readonly description: "This is the API ID of the guest (not the user).";
                    readonly deprecated: true;
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
                readonly email: {
                    readonly deprecated: true;
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
                readonly proxy_key: {
                    readonly deprecated: true;
                    readonly description: "In the check in QR code, this is the value of the `pk` parameter.";
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
            };
            readonly required: readonly [];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly $schema: "https://json-schema.org/draft/2020-12/schema";
            readonly type: "object";
            readonly properties: {
                readonly guest: {
                    readonly type: "object";
                    readonly properties: {
                        readonly id: {
                            readonly type: "string";
                        };
                        readonly user_id: {
                            readonly type: "string";
                        };
                        readonly user_email: {
                            readonly type: "string";
                        };
                        readonly user_name: {
                            readonly anyOf: readonly [{
                                readonly type: "string";
                            }, {
                                readonly type: "null";
                            }];
                        };
                        readonly user_first_name: {
                            readonly anyOf: readonly [{
                                readonly type: "string";
                            }, {
                                readonly type: "null";
                            }];
                        };
                        readonly user_last_name: {
                            readonly anyOf: readonly [{
                                readonly type: "string";
                            }, {
                                readonly type: "null";
                            }];
                        };
                        readonly approval_status: {
                            readonly type: "string";
                            readonly enum: readonly ["approved", "session", "pending_approval", "invited", "declined", "waitlist"];
                            readonly description: "`approved` `session` `pending_approval` `invited` `declined` `waitlist`";
                        };
                        readonly check_in_qr_code: {
                            readonly type: "string";
                        };
                        readonly custom_source: {
                            readonly anyOf: readonly [{
                                readonly type: "string";
                            }, {
                                readonly type: "null";
                            }];
                        };
                        readonly eth_address: {
                            readonly anyOf: readonly [{
                                readonly type: "string";
                                readonly pattern: "^0x[0-9a-fA-F]{40}$";
                            }, {
                                readonly type: "null";
                            }];
                        };
                        readonly invited_at: {
                            readonly anyOf: readonly [{
                                readonly description: "ISO 8601 Datetime. For example, 2022-10-19T03:27:13.673Z";
                                readonly type: "string";
                                readonly format: "date-time";
                                readonly pattern: "^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d+)?)?(?:Z|([+-](?:[01]\\d|2[0-3]):[0-5]\\d)))$";
                            }, {
                                readonly type: "null";
                            }];
                        };
                        readonly joined_at: {
                            readonly anyOf: readonly [{
                                readonly description: "ISO 8601 Datetime. For example, 2022-10-19T03:27:13.673Z";
                                readonly type: "string";
                                readonly format: "date-time";
                                readonly pattern: "^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d+)?)?(?:Z|([+-](?:[01]\\d|2[0-3]):[0-5]\\d)))$";
                            }, {
                                readonly type: "null";
                            }];
                        };
                        readonly phone_number: {
                            readonly anyOf: readonly [{
                                readonly type: "string";
                            }, {
                                readonly type: "null";
                            }];
                        };
                        readonly registered_at: {
                            readonly anyOf: readonly [{
                                readonly description: "ISO 8601 Datetime. For example, 2022-10-19T03:27:13.673Z";
                                readonly type: "string";
                                readonly format: "date-time";
                                readonly pattern: "^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d+)?)?(?:Z|([+-](?:[01]\\d|2[0-3]):[0-5]\\d)))$";
                            }, {
                                readonly type: "null";
                            }];
                        };
                        readonly registration_answers: {
                            readonly anyOf: readonly [{
                                readonly type: "array";
                                readonly items: {
                                    readonly anyOf: readonly [{
                                        readonly type: "object";
                                        readonly properties: {
                                            readonly label: {
                                                readonly type: "string";
                                            };
                                            readonly question_id: {
                                                readonly type: "string";
                                            };
                                            readonly value: {
                                                readonly type: "boolean";
                                            };
                                            readonly answer: {
                                                readonly type: "boolean";
                                            };
                                            readonly question_type: {
                                                readonly type: "string";
                                                readonly const: "agree-check";
                                            };
                                        };
                                        readonly required: readonly ["label", "question_id", "value", "question_type"];
                                    }, {
                                        readonly type: "object";
                                        readonly properties: {
                                            readonly label: {
                                                readonly type: "string";
                                            };
                                            readonly question_id: {
                                                readonly type: "string";
                                            };
                                            readonly value: {
                                                readonly type: "object";
                                                readonly properties: {
                                                    readonly company: {
                                                        readonly anyOf: readonly [{
                                                            readonly type: "string";
                                                        }, {
                                                            readonly type: "null";
                                                        }];
                                                    };
                                                    readonly job_title: {
                                                        readonly anyOf: readonly [{
                                                            readonly type: "string";
                                                        }, {
                                                            readonly type: "null";
                                                        }];
                                                    };
                                                };
                                            };
                                            readonly answer: {
                                                readonly anyOf: readonly [{
                                                    readonly type: "string";
                                                }, {
                                                    readonly type: "null";
                                                }];
                                            };
                                            readonly answer_company: {
                                                readonly anyOf: readonly [{
                                                    readonly type: "string";
                                                }, {
                                                    readonly type: "null";
                                                }];
                                            };
                                            readonly answer_job_title: {
                                                readonly anyOf: readonly [{
                                                    readonly type: "string";
                                                }, {
                                                    readonly type: "null";
                                                }];
                                            };
                                            readonly question_type: {
                                                readonly type: "string";
                                                readonly const: "company";
                                            };
                                        };
                                        readonly required: readonly ["label", "question_id", "value", "question_type"];
                                    }, {
                                        readonly type: "object";
                                        readonly properties: {
                                            readonly label: {
                                                readonly type: "string";
                                            };
                                            readonly question_id: {
                                                readonly type: "string";
                                            };
                                            readonly value: {
                                                readonly anyOf: readonly [{
                                                    readonly type: "string";
                                                }, {
                                                    readonly type: "null";
                                                }];
                                            };
                                            readonly answer: {
                                                readonly anyOf: readonly [{
                                                    readonly type: "string";
                                                }, {
                                                    readonly type: "null";
                                                }];
                                            };
                                            readonly question_type: {
                                                readonly type: "string";
                                                readonly const: "dropdown";
                                            };
                                        };
                                        readonly required: readonly ["label", "question_id", "value", "question_type"];
                                    }, {
                                        readonly type: "object";
                                        readonly properties: {
                                            readonly label: {
                                                readonly type: "string";
                                            };
                                            readonly question_id: {
                                                readonly type: "string";
                                            };
                                            readonly value: {
                                                readonly anyOf: readonly [{
                                                    readonly type: "array";
                                                    readonly items: {
                                                        readonly type: "string";
                                                    };
                                                }, {
                                                    readonly type: "null";
                                                }];
                                            };
                                            readonly answer: {
                                                readonly anyOf: readonly [{
                                                    readonly type: "array";
                                                    readonly items: {
                                                        readonly type: "string";
                                                    };
                                                }, {
                                                    readonly type: "null";
                                                }];
                                            };
                                            readonly question_type: {
                                                readonly type: "string";
                                                readonly const: "multi-select";
                                            };
                                        };
                                        readonly required: readonly ["label", "question_id", "value", "question_type"];
                                    }, {
                                        readonly type: "object";
                                        readonly properties: {
                                            readonly label: {
                                                readonly type: "string";
                                            };
                                            readonly question_id: {
                                                readonly type: "string";
                                            };
                                            readonly value: {
                                                readonly anyOf: readonly [{
                                                    readonly type: "string";
                                                }, {
                                                    readonly type: "null";
                                                }];
                                            };
                                            readonly answer: {
                                                readonly anyOf: readonly [{
                                                    readonly type: "string";
                                                }, {
                                                    readonly type: "null";
                                                }];
                                            };
                                            readonly question_type: {
                                                readonly type: "string";
                                                readonly const: "phone-number";
                                            };
                                        };
                                        readonly required: readonly ["label", "question_id", "value", "question_type"];
                                    }, {
                                        readonly type: "object";
                                        readonly properties: {
                                            readonly label: {
                                                readonly type: "string";
                                            };
                                            readonly question_id: {
                                                readonly type: "string";
                                            };
                                            readonly value: {
                                                readonly anyOf: readonly [{
                                                    readonly anyOf: readonly [{
                                                        readonly type: "string";
                                                    }, {
                                                        readonly type: "boolean";
                                                        readonly const: true;
                                                    }];
                                                }, {
                                                    readonly type: "null";
                                                }];
                                            };
                                            readonly answer: {
                                                readonly anyOf: readonly [{
                                                    readonly anyOf: readonly [{
                                                        readonly type: "string";
                                                    }, {
                                                        readonly type: "boolean";
                                                        readonly const: true;
                                                    }];
                                                }, {
                                                    readonly type: "null";
                                                }];
                                            };
                                            readonly question_type: {
                                                readonly type: "string";
                                                readonly const: "terms";
                                            };
                                        };
                                        readonly required: readonly ["label", "question_id", "value", "question_type"];
                                    }, {
                                        readonly type: "object";
                                        readonly properties: {
                                            readonly label: {
                                                readonly type: "string";
                                            };
                                            readonly question_id: {
                                                readonly type: "string";
                                            };
                                            readonly value: {
                                                readonly anyOf: readonly [{
                                                    readonly type: "string";
                                                }, {
                                                    readonly type: "null";
                                                }];
                                            };
                                            readonly answer: {
                                                readonly anyOf: readonly [{
                                                    readonly type: "string";
                                                }, {
                                                    readonly type: "null";
                                                }];
                                            };
                                            readonly question_type: {
                                                readonly anyOf: readonly [{
                                                    readonly type: "string";
                                                    readonly const: "github";
                                                }, {
                                                    readonly type: "string";
                                                    readonly const: "instagram";
                                                }, {
                                                    readonly type: "string";
                                                    readonly const: "linkedin";
                                                }, {
                                                    readonly type: "string";
                                                    readonly const: "long-text";
                                                }, {
                                                    readonly type: "string";
                                                    readonly const: "telegram";
                                                }, {
                                                    readonly type: "string";
                                                    readonly const: "text";
                                                }, {
                                                    readonly type: "string";
                                                    readonly const: "twitter";
                                                }, {
                                                    readonly type: "string";
                                                    readonly const: "youtube";
                                                }];
                                            };
                                        };
                                        readonly required: readonly ["label", "question_id", "value", "question_type"];
                                    }, {
                                        readonly type: "object";
                                        readonly properties: {
                                            readonly label: {
                                                readonly type: "string";
                                            };
                                            readonly question_id: {
                                                readonly type: "string";
                                            };
                                            readonly value: {
                                                readonly anyOf: readonly [{
                                                    readonly type: "string";
                                                }, {
                                                    readonly type: "null";
                                                }];
                                            };
                                            readonly answer: {
                                                readonly anyOf: readonly [{
                                                    readonly type: "string";
                                                }, {
                                                    readonly type: "null";
                                                }];
                                            };
                                            readonly question_type: {
                                                readonly type: "string";
                                                readonly const: "url";
                                            };
                                        };
                                        readonly required: readonly ["label", "question_id", "value", "question_type"];
                                    }];
                                };
                            }, {
                                readonly type: "null";
                            }];
                        };
                        readonly solana_address: {
                            readonly anyOf: readonly [{
                                readonly type: "string";
                                readonly pattern: "^[5KL1-9A-HJ-NP-Za-km-z]{32,44}$";
                            }, {
                                readonly type: "null";
                            }];
                        };
                        readonly event_tickets: {
                            readonly type: "array";
                            readonly items: {
                                readonly type: "object";
                                readonly properties: {
                                    readonly id: {
                                        readonly type: "string";
                                    };
                                    readonly amount: {
                                        readonly type: "number";
                                    };
                                    readonly amount_discount: {
                                        readonly type: "number";
                                    };
                                    readonly amount_tax: {
                                        readonly type: "number";
                                    };
                                    readonly currency: {
                                        readonly anyOf: readonly [{
                                            readonly type: "string";
                                            readonly enum: readonly ["solana_sol", "solana_usdc", "aed", "afn", "all", "amd", "ang", "aoa", "ars", "aud", "awg", "azn", "bam", "bbd", "bdt", "bgn", "bhd", "bif", "bmd", "bnd", "bob", "brl", "bsd", "bwp", "byn", "bzd", "cad", "cdf", "chf", "clp", "cny", "cop", "crc", "cve", "czk", "djf", "dkk", "dop", "dzd", "egp", "etb", "eur", "fjd", "fkp", "gbp", "gel", "ghs", "gip", "gmd", "gnf", "gtq", "gyd", "hkd", "hnl", "htg", "huf", "idr", "ils", "inr", "isk", "jmd", "jod", "jpy", "kes", "kgs", "khr", "kmf", "krw", "kwd", "kyd", "kzt", "lak", "lbp", "lkr", "lrd", "lsl", "mad", "mdl", "mga", "mkd", "mmk", "mnt", "mop", "mur", "mvr", "mwk", "mxn", "myr", "mzn", "nad", "ngn", "nio", "nok", "npr", "nzd", "omr", "pab", "pen", "pgk", "php", "pkr", "pln", "pyg", "qar", "ron", "rsd", "rub", "rwf", "sar", "sbd", "scr", "sek", "sgd", "shp", "sle", "sos", "srd", "std", "szl", "thb", "tjs", "tnd", "top", "try", "ttd", "twd", "tzs", "uah", "ugx", "usd", "uyu", "uzs", "vnd", "vuv", "wst", "xaf", "xcd", "xof", "xpf", "yer", "zar", "zmw"];
                                            readonly description: "`solana_sol` `solana_usdc` `aed` `afn` `all` `amd` `ang` `aoa` `ars` `aud` `awg` `azn` `bam` `bbd` `bdt` `bgn` `bhd` `bif` `bmd` `bnd` `bob` `brl` `bsd` `bwp` `byn` `bzd` `cad` `cdf` `chf` `clp` `cny` `cop` `crc` `cve` `czk` `djf` `dkk` `dop` `dzd` `egp` `etb` `eur` `fjd` `fkp` `gbp` `gel` `ghs` `gip` `gmd` `gnf` `gtq` `gyd` `hkd` `hnl` `htg` `huf` `idr` `ils` `inr` `isk` `jmd` `jod` `jpy` `kes` `kgs` `khr` `kmf` `krw` `kwd` `kyd` `kzt` `lak` `lbp` `lkr` `lrd` `lsl` `mad` `mdl` `mga` `mkd` `mmk` `mnt` `mop` `mur` `mvr` `mwk` `mxn` `myr` `mzn` `nad` `ngn` `nio` `nok` `npr` `nzd` `omr` `pab` `pen` `pgk` `php` `pkr` `pln` `pyg` `qar` `ron` `rsd` `rub` `rwf` `sar` `sbd` `scr` `sek` `sgd` `shp` `sle` `sos` `srd` `std` `szl` `thb` `tjs` `tnd` `top` `try` `ttd` `twd` `tzs` `uah` `ugx` `usd` `uyu` `uzs` `vnd` `vuv` `wst` `xaf` `xcd` `xof` `xpf` `yer` `zar` `zmw`";
                                        }, {
                                            readonly type: "null";
                                        }];
                                    };
                                    readonly checked_in_at: {
                                        readonly anyOf: readonly [{
                                            readonly description: "ISO 8601 Datetime. For example, 2022-10-19T03:27:13.673Z";
                                            readonly type: "string";
                                            readonly format: "date-time";
                                            readonly pattern: "^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d+)?)?(?:Z|([+-](?:[01]\\d|2[0-3]):[0-5]\\d)))$";
                                        }, {
                                            readonly type: "null";
                                        }];
                                    };
                                    readonly event_ticket_type_id: {
                                        readonly type: "string";
                                    };
                                    readonly is_captured: {
                                        readonly type: "boolean";
                                    };
                                    readonly name: {
                                        readonly type: "string";
                                    };
                                    readonly api_id: {
                                        readonly deprecated: true;
                                        readonly type: "string";
                                    };
                                };
                                readonly required: readonly ["id", "amount", "amount_discount", "amount_tax", "currency", "checked_in_at", "event_ticket_type_id", "is_captured", "name", "api_id"];
                            };
                        };
                        readonly api_id: {
                            readonly deprecated: true;
                            readonly type: "string";
                        };
                        readonly event_ticket: {
                            readonly deprecated: true;
                            readonly anyOf: readonly [{
                                readonly type: "object";
                                readonly properties: {
                                    readonly id: {
                                        readonly type: "string";
                                    };
                                    readonly amount: {
                                        readonly type: "number";
                                    };
                                    readonly amount_discount: {
                                        readonly type: "number";
                                    };
                                    readonly amount_tax: {
                                        readonly type: "number";
                                    };
                                    readonly currency: {
                                        readonly anyOf: readonly [{
                                            readonly type: "string";
                                            readonly enum: readonly ["solana_sol", "solana_usdc", "aed", "afn", "all", "amd", "ang", "aoa", "ars", "aud", "awg", "azn", "bam", "bbd", "bdt", "bgn", "bhd", "bif", "bmd", "bnd", "bob", "brl", "bsd", "bwp", "byn", "bzd", "cad", "cdf", "chf", "clp", "cny", "cop", "crc", "cve", "czk", "djf", "dkk", "dop", "dzd", "egp", "etb", "eur", "fjd", "fkp", "gbp", "gel", "ghs", "gip", "gmd", "gnf", "gtq", "gyd", "hkd", "hnl", "htg", "huf", "idr", "ils", "inr", "isk", "jmd", "jod", "jpy", "kes", "kgs", "khr", "kmf", "krw", "kwd", "kyd", "kzt", "lak", "lbp", "lkr", "lrd", "lsl", "mad", "mdl", "mga", "mkd", "mmk", "mnt", "mop", "mur", "mvr", "mwk", "mxn", "myr", "mzn", "nad", "ngn", "nio", "nok", "npr", "nzd", "omr", "pab", "pen", "pgk", "php", "pkr", "pln", "pyg", "qar", "ron", "rsd", "rub", "rwf", "sar", "sbd", "scr", "sek", "sgd", "shp", "sle", "sos", "srd", "std", "szl", "thb", "tjs", "tnd", "top", "try", "ttd", "twd", "tzs", "uah", "ugx", "usd", "uyu", "uzs", "vnd", "vuv", "wst", "xaf", "xcd", "xof", "xpf", "yer", "zar", "zmw"];
                                            readonly description: "`solana_sol` `solana_usdc` `aed` `afn` `all` `amd` `ang` `aoa` `ars` `aud` `awg` `azn` `bam` `bbd` `bdt` `bgn` `bhd` `bif` `bmd` `bnd` `bob` `brl` `bsd` `bwp` `byn` `bzd` `cad` `cdf` `chf` `clp` `cny` `cop` `crc` `cve` `czk` `djf` `dkk` `dop` `dzd` `egp` `etb` `eur` `fjd` `fkp` `gbp` `gel` `ghs` `gip` `gmd` `gnf` `gtq` `gyd` `hkd` `hnl` `htg` `huf` `idr` `ils` `inr` `isk` `jmd` `jod` `jpy` `kes` `kgs` `khr` `kmf` `krw` `kwd` `kyd` `kzt` `lak` `lbp` `lkr` `lrd` `lsl` `mad` `mdl` `mga` `mkd` `mmk` `mnt` `mop` `mur` `mvr` `mwk` `mxn` `myr` `mzn` `nad` `ngn` `nio` `nok` `npr` `nzd` `omr` `pab` `pen` `pgk` `php` `pkr` `pln` `pyg` `qar` `ron` `rsd` `rub` `rwf` `sar` `sbd` `scr` `sek` `sgd` `shp` `sle` `sos` `srd` `std` `szl` `thb` `tjs` `tnd` `top` `try` `ttd` `twd` `tzs` `uah` `ugx` `usd` `uyu` `uzs` `vnd` `vuv` `wst` `xaf` `xcd` `xof` `xpf` `yer` `zar` `zmw`";
                                        }, {
                                            readonly type: "null";
                                        }];
                                    };
                                    readonly checked_in_at: {
                                        readonly anyOf: readonly [{
                                            readonly description: "ISO 8601 Datetime. For example, 2022-10-19T03:27:13.673Z";
                                            readonly type: "string";
                                            readonly format: "date-time";
                                            readonly pattern: "^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d+)?)?(?:Z|([+-](?:[01]\\d|2[0-3]):[0-5]\\d)))$";
                                        }, {
                                            readonly type: "null";
                                        }];
                                    };
                                    readonly event_ticket_type_id: {
                                        readonly type: "string";
                                    };
                                    readonly is_captured: {
                                        readonly type: "boolean";
                                    };
                                    readonly name: {
                                        readonly type: "string";
                                    };
                                    readonly api_id: {
                                        readonly deprecated: true;
                                        readonly type: "string";
                                    };
                                };
                                readonly required: readonly ["id", "amount", "amount_discount", "amount_tax", "currency", "checked_in_at", "event_ticket_type_id", "is_captured", "name", "api_id"];
                            }, {
                                readonly type: "null";
                            }];
                        };
                        readonly user_api_id: {
                            readonly deprecated: true;
                            readonly type: "string";
                        };
                        readonly checked_in_at: {
                            readonly deprecated: true;
                            readonly anyOf: readonly [{
                                readonly description: "ISO 8601 Datetime. For example, 2022-10-19T03:27:13.673Z";
                                readonly type: "string";
                                readonly format: "date-time";
                                readonly pattern: "^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d+)?)?(?:Z|([+-](?:[01]\\d|2[0-3]):[0-5]\\d)))$";
                            }, {
                                readonly type: "null";
                            }];
                        };
                        readonly event_ticket_orders: {
                            readonly type: "array";
                            readonly items: {
                                readonly type: "object";
                                readonly properties: {
                                    readonly id: {
                                        readonly type: "string";
                                    };
                                    readonly amount: {
                                        readonly type: "number";
                                    };
                                    readonly amount_discount: {
                                        readonly type: "number";
                                    };
                                    readonly amount_tax: {
                                        readonly type: "number";
                                    };
                                    readonly currency: {
                                        readonly anyOf: readonly [{
                                            readonly type: "string";
                                            readonly enum: readonly ["solana_sol", "solana_usdc", "aed", "afn", "all", "amd", "ang", "aoa", "ars", "aud", "awg", "azn", "bam", "bbd", "bdt", "bgn", "bhd", "bif", "bmd", "bnd", "bob", "brl", "bsd", "bwp", "byn", "bzd", "cad", "cdf", "chf", "clp", "cny", "cop", "crc", "cve", "czk", "djf", "dkk", "dop", "dzd", "egp", "etb", "eur", "fjd", "fkp", "gbp", "gel", "ghs", "gip", "gmd", "gnf", "gtq", "gyd", "hkd", "hnl", "htg", "huf", "idr", "ils", "inr", "isk", "jmd", "jod", "jpy", "kes", "kgs", "khr", "kmf", "krw", "kwd", "kyd", "kzt", "lak", "lbp", "lkr", "lrd", "lsl", "mad", "mdl", "mga", "mkd", "mmk", "mnt", "mop", "mur", "mvr", "mwk", "mxn", "myr", "mzn", "nad", "ngn", "nio", "nok", "npr", "nzd", "omr", "pab", "pen", "pgk", "php", "pkr", "pln", "pyg", "qar", "ron", "rsd", "rub", "rwf", "sar", "sbd", "scr", "sek", "sgd", "shp", "sle", "sos", "srd", "std", "szl", "thb", "tjs", "tnd", "top", "try", "ttd", "twd", "tzs", "uah", "ugx", "usd", "uyu", "uzs", "vnd", "vuv", "wst", "xaf", "xcd", "xof", "xpf", "yer", "zar", "zmw"];
                                            readonly description: "`solana_sol` `solana_usdc` `aed` `afn` `all` `amd` `ang` `aoa` `ars` `aud` `awg` `azn` `bam` `bbd` `bdt` `bgn` `bhd` `bif` `bmd` `bnd` `bob` `brl` `bsd` `bwp` `byn` `bzd` `cad` `cdf` `chf` `clp` `cny` `cop` `crc` `cve` `czk` `djf` `dkk` `dop` `dzd` `egp` `etb` `eur` `fjd` `fkp` `gbp` `gel` `ghs` `gip` `gmd` `gnf` `gtq` `gyd` `hkd` `hnl` `htg` `huf` `idr` `ils` `inr` `isk` `jmd` `jod` `jpy` `kes` `kgs` `khr` `kmf` `krw` `kwd` `kyd` `kzt` `lak` `lbp` `lkr` `lrd` `lsl` `mad` `mdl` `mga` `mkd` `mmk` `mnt` `mop` `mur` `mvr` `mwk` `mxn` `myr` `mzn` `nad` `ngn` `nio` `nok` `npr` `nzd` `omr` `pab` `pen` `pgk` `php` `pkr` `pln` `pyg` `qar` `ron` `rsd` `rub` `rwf` `sar` `sbd` `scr` `sek` `sgd` `shp` `sle` `sos` `srd` `std` `szl` `thb` `tjs` `tnd` `top` `try` `ttd` `twd` `tzs` `uah` `ugx` `usd` `uyu` `uzs` `vnd` `vuv` `wst` `xaf` `xcd` `xof` `xpf` `yer` `zar` `zmw`";
                                        }, {
                                            readonly type: "null";
                                        }];
                                    };
                                    readonly coupon_info: {
                                        readonly anyOf: readonly [{
                                            readonly type: "object";
                                            readonly properties: {
                                                readonly api_id: {
                                                    readonly type: "string";
                                                };
                                                readonly percent_off: {
                                                    readonly anyOf: readonly [{
                                                        readonly type: "number";
                                                    }, {
                                                        readonly type: "null";
                                                    }];
                                                };
                                                readonly cents_off: {
                                                    readonly anyOf: readonly [{
                                                        readonly type: "number";
                                                    }, {
                                                        readonly type: "null";
                                                    }];
                                                };
                                                readonly currency: {
                                                    readonly anyOf: readonly [{
                                                        readonly type: "string";
                                                        readonly enum: readonly ["solana_sol", "solana_usdc", "aed", "afn", "all", "amd", "ang", "aoa", "ars", "aud", "awg", "azn", "bam", "bbd", "bdt", "bgn", "bhd", "bif", "bmd", "bnd", "bob", "brl", "bsd", "bwp", "byn", "bzd", "cad", "cdf", "chf", "clp", "cny", "cop", "crc", "cve", "czk", "djf", "dkk", "dop", "dzd", "egp", "etb", "eur", "fjd", "fkp", "gbp", "gel", "ghs", "gip", "gmd", "gnf", "gtq", "gyd", "hkd", "hnl", "htg", "huf", "idr", "ils", "inr", "isk", "jmd", "jod", "jpy", "kes", "kgs", "khr", "kmf", "krw", "kwd", "kyd", "kzt", "lak", "lbp", "lkr", "lrd", "lsl", "mad", "mdl", "mga", "mkd", "mmk", "mnt", "mop", "mur", "mvr", "mwk", "mxn", "myr", "mzn", "nad", "ngn", "nio", "nok", "npr", "nzd", "omr", "pab", "pen", "pgk", "php", "pkr", "pln", "pyg", "qar", "ron", "rsd", "rub", "rwf", "sar", "sbd", "scr", "sek", "sgd", "shp", "sle", "sos", "srd", "std", "szl", "thb", "tjs", "tnd", "top", "try", "ttd", "twd", "tzs", "uah", "ugx", "usd", "uyu", "uzs", "vnd", "vuv", "wst", "xaf", "xcd", "xof", "xpf", "yer", "zar", "zmw"];
                                                        readonly description: "`solana_sol` `solana_usdc` `aed` `afn` `all` `amd` `ang` `aoa` `ars` `aud` `awg` `azn` `bam` `bbd` `bdt` `bgn` `bhd` `bif` `bmd` `bnd` `bob` `brl` `bsd` `bwp` `byn` `bzd` `cad` `cdf` `chf` `clp` `cny` `cop` `crc` `cve` `czk` `djf` `dkk` `dop` `dzd` `egp` `etb` `eur` `fjd` `fkp` `gbp` `gel` `ghs` `gip` `gmd` `gnf` `gtq` `gyd` `hkd` `hnl` `htg` `huf` `idr` `ils` `inr` `isk` `jmd` `jod` `jpy` `kes` `kgs` `khr` `kmf` `krw` `kwd` `kyd` `kzt` `lak` `lbp` `lkr` `lrd` `lsl` `mad` `mdl` `mga` `mkd` `mmk` `mnt` `mop` `mur` `mvr` `mwk` `mxn` `myr` `mzn` `nad` `ngn` `nio` `nok` `npr` `nzd` `omr` `pab` `pen` `pgk` `php` `pkr` `pln` `pyg` `qar` `ron` `rsd` `rub` `rwf` `sar` `sbd` `scr` `sek` `sgd` `shp` `sle` `sos` `srd` `std` `szl` `thb` `tjs` `tnd` `top` `try` `ttd` `twd` `tzs` `uah` `ugx` `usd` `uyu` `uzs` `vnd` `vuv` `wst` `xaf` `xcd` `xof` `xpf` `yer` `zar` `zmw`";
                                                    }, {
                                                        readonly type: "null";
                                                    }];
                                                };
                                                readonly code: {
                                                    readonly type: "string";
                                                };
                                            };
                                            readonly required: readonly ["api_id", "percent_off", "cents_off", "currency", "code"];
                                        }, {
                                            readonly type: "null";
                                        }];
                                    };
                                    readonly is_captured: {
                                        readonly type: "boolean";
                                    };
                                    readonly api_id: {
                                        readonly deprecated: true;
                                        readonly type: "string";
                                    };
                                };
                                readonly required: readonly ["id", "amount", "amount_discount", "amount_tax", "currency", "coupon_info", "is_captured", "api_id"];
                            };
                        };
                    };
                    readonly required: readonly ["id", "user_id", "user_email", "user_name", "user_first_name", "user_last_name", "approval_status", "check_in_qr_code", "custom_source", "eth_address", "invited_at", "joined_at", "phone_number", "registered_at", "registration_answers", "solana_address", "event_tickets", "api_id", "event_ticket", "user_api_id", "checked_in_at", "event_ticket_orders"];
                };
            };
            readonly required: readonly ["guest"];
        };
    };
};
declare const GetV1EventGetGuests: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly event_id: {
                    readonly description: "Event ID, this usually starts with evt-";
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
                readonly approval_status: {
                    readonly type: "string";
                    readonly enum: readonly ["approved", "session", "pending_approval", "invited", "declined", "waitlist"];
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
                readonly pagination_cursor: {
                    readonly description: "Value of `next_cursor` from a previous request.";
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
                readonly pagination_limit: {
                    readonly description: "The number of items to return. The server will enforce a maximum number.";
                    readonly type: "number";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
                readonly sort_column: {
                    readonly type: "string";
                    readonly enum: readonly ["name", "email", "created_at", "registered_at", "checked_in_at"];
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
                readonly sort_direction: {
                    readonly type: "string";
                    readonly enum: readonly ["asc", "desc", "asc nulls last", "desc nulls last"];
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
                readonly event_api_id: {
                    readonly deprecated: true;
                    readonly description: "Event API ID, this usually starts with evt-";
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
            };
            readonly required: readonly [];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly $schema: "https://json-schema.org/draft/2020-12/schema";
            readonly type: "object";
            readonly properties: {
                readonly entries: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly api_id: {
                                readonly type: "string";
                            };
                            readonly guest: {
                                readonly type: "object";
                                readonly properties: {
                                    readonly id: {
                                        readonly type: "string";
                                    };
                                    readonly user_id: {
                                        readonly type: "string";
                                    };
                                    readonly user_email: {
                                        readonly type: "string";
                                    };
                                    readonly user_name: {
                                        readonly anyOf: readonly [{
                                            readonly type: "string";
                                        }, {
                                            readonly type: "null";
                                        }];
                                    };
                                    readonly user_first_name: {
                                        readonly anyOf: readonly [{
                                            readonly type: "string";
                                        }, {
                                            readonly type: "null";
                                        }];
                                    };
                                    readonly user_last_name: {
                                        readonly anyOf: readonly [{
                                            readonly type: "string";
                                        }, {
                                            readonly type: "null";
                                        }];
                                    };
                                    readonly approval_status: {
                                        readonly type: "string";
                                        readonly enum: readonly ["approved", "session", "pending_approval", "invited", "declined", "waitlist"];
                                        readonly description: "`approved` `session` `pending_approval` `invited` `declined` `waitlist`";
                                    };
                                    readonly check_in_qr_code: {
                                        readonly type: "string";
                                    };
                                    readonly custom_source: {
                                        readonly anyOf: readonly [{
                                            readonly type: "string";
                                        }, {
                                            readonly type: "null";
                                        }];
                                    };
                                    readonly eth_address: {
                                        readonly anyOf: readonly [{
                                            readonly type: "string";
                                            readonly pattern: "^0x[0-9a-fA-F]{40}$";
                                        }, {
                                            readonly type: "null";
                                        }];
                                    };
                                    readonly invited_at: {
                                        readonly anyOf: readonly [{
                                            readonly description: "ISO 8601 Datetime. For example, 2022-10-19T03:27:13.673Z";
                                            readonly type: "string";
                                            readonly format: "date-time";
                                            readonly pattern: "^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d+)?)?(?:Z|([+-](?:[01]\\d|2[0-3]):[0-5]\\d)))$";
                                        }, {
                                            readonly type: "null";
                                        }];
                                    };
                                    readonly joined_at: {
                                        readonly anyOf: readonly [{
                                            readonly description: "ISO 8601 Datetime. For example, 2022-10-19T03:27:13.673Z";
                                            readonly type: "string";
                                            readonly format: "date-time";
                                            readonly pattern: "^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d+)?)?(?:Z|([+-](?:[01]\\d|2[0-3]):[0-5]\\d)))$";
                                        }, {
                                            readonly type: "null";
                                        }];
                                    };
                                    readonly phone_number: {
                                        readonly anyOf: readonly [{
                                            readonly type: "string";
                                        }, {
                                            readonly type: "null";
                                        }];
                                    };
                                    readonly registered_at: {
                                        readonly anyOf: readonly [{
                                            readonly description: "ISO 8601 Datetime. For example, 2022-10-19T03:27:13.673Z";
                                            readonly type: "string";
                                            readonly format: "date-time";
                                            readonly pattern: "^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d+)?)?(?:Z|([+-](?:[01]\\d|2[0-3]):[0-5]\\d)))$";
                                        }, {
                                            readonly type: "null";
                                        }];
                                    };
                                    readonly registration_answers: {
                                        readonly anyOf: readonly [{
                                            readonly type: "array";
                                            readonly items: {
                                                readonly anyOf: readonly [{
                                                    readonly type: "object";
                                                    readonly properties: {
                                                        readonly label: {
                                                            readonly type: "string";
                                                        };
                                                        readonly question_id: {
                                                            readonly type: "string";
                                                        };
                                                        readonly value: {
                                                            readonly type: "boolean";
                                                        };
                                                        readonly answer: {
                                                            readonly type: "boolean";
                                                        };
                                                        readonly question_type: {
                                                            readonly type: "string";
                                                            readonly const: "agree-check";
                                                        };
                                                    };
                                                    readonly required: readonly ["label", "question_id", "value", "question_type"];
                                                }, {
                                                    readonly type: "object";
                                                    readonly properties: {
                                                        readonly label: {
                                                            readonly type: "string";
                                                        };
                                                        readonly question_id: {
                                                            readonly type: "string";
                                                        };
                                                        readonly value: {
                                                            readonly type: "object";
                                                            readonly properties: {
                                                                readonly company: {
                                                                    readonly anyOf: readonly [{
                                                                        readonly type: "string";
                                                                    }, {
                                                                        readonly type: "null";
                                                                    }];
                                                                };
                                                                readonly job_title: {
                                                                    readonly anyOf: readonly [{
                                                                        readonly type: "string";
                                                                    }, {
                                                                        readonly type: "null";
                                                                    }];
                                                                };
                                                            };
                                                        };
                                                        readonly answer: {
                                                            readonly anyOf: readonly [{
                                                                readonly type: "string";
                                                            }, {
                                                                readonly type: "null";
                                                            }];
                                                        };
                                                        readonly answer_company: {
                                                            readonly anyOf: readonly [{
                                                                readonly type: "string";
                                                            }, {
                                                                readonly type: "null";
                                                            }];
                                                        };
                                                        readonly answer_job_title: {
                                                            readonly anyOf: readonly [{
                                                                readonly type: "string";
                                                            }, {
                                                                readonly type: "null";
                                                            }];
                                                        };
                                                        readonly question_type: {
                                                            readonly type: "string";
                                                            readonly const: "company";
                                                        };
                                                    };
                                                    readonly required: readonly ["label", "question_id", "value", "question_type"];
                                                }, {
                                                    readonly type: "object";
                                                    readonly properties: {
                                                        readonly label: {
                                                            readonly type: "string";
                                                        };
                                                        readonly question_id: {
                                                            readonly type: "string";
                                                        };
                                                        readonly value: {
                                                            readonly anyOf: readonly [{
                                                                readonly type: "string";
                                                            }, {
                                                                readonly type: "null";
                                                            }];
                                                        };
                                                        readonly answer: {
                                                            readonly anyOf: readonly [{
                                                                readonly type: "string";
                                                            }, {
                                                                readonly type: "null";
                                                            }];
                                                        };
                                                        readonly question_type: {
                                                            readonly type: "string";
                                                            readonly const: "dropdown";
                                                        };
                                                    };
                                                    readonly required: readonly ["label", "question_id", "value", "question_type"];
                                                }, {
                                                    readonly type: "object";
                                                    readonly properties: {
                                                        readonly label: {
                                                            readonly type: "string";
                                                        };
                                                        readonly question_id: {
                                                            readonly type: "string";
                                                        };
                                                        readonly value: {
                                                            readonly anyOf: readonly [{
                                                                readonly type: "array";
                                                                readonly items: {
                                                                    readonly type: "string";
                                                                };
                                                            }, {
                                                                readonly type: "null";
                                                            }];
                                                        };
                                                        readonly answer: {
                                                            readonly anyOf: readonly [{
                                                                readonly type: "array";
                                                                readonly items: {
                                                                    readonly type: "string";
                                                                };
                                                            }, {
                                                                readonly type: "null";
                                                            }];
                                                        };
                                                        readonly question_type: {
                                                            readonly type: "string";
                                                            readonly const: "multi-select";
                                                        };
                                                    };
                                                    readonly required: readonly ["label", "question_id", "value", "question_type"];
                                                }, {
                                                    readonly type: "object";
                                                    readonly properties: {
                                                        readonly label: {
                                                            readonly type: "string";
                                                        };
                                                        readonly question_id: {
                                                            readonly type: "string";
                                                        };
                                                        readonly value: {
                                                            readonly anyOf: readonly [{
                                                                readonly type: "string";
                                                            }, {
                                                                readonly type: "null";
                                                            }];
                                                        };
                                                        readonly answer: {
                                                            readonly anyOf: readonly [{
                                                                readonly type: "string";
                                                            }, {
                                                                readonly type: "null";
                                                            }];
                                                        };
                                                        readonly question_type: {
                                                            readonly type: "string";
                                                            readonly const: "phone-number";
                                                        };
                                                    };
                                                    readonly required: readonly ["label", "question_id", "value", "question_type"];
                                                }, {
                                                    readonly type: "object";
                                                    readonly properties: {
                                                        readonly label: {
                                                            readonly type: "string";
                                                        };
                                                        readonly question_id: {
                                                            readonly type: "string";
                                                        };
                                                        readonly value: {
                                                            readonly anyOf: readonly [{
                                                                readonly anyOf: readonly [{
                                                                    readonly type: "string";
                                                                }, {
                                                                    readonly type: "boolean";
                                                                    readonly const: true;
                                                                }];
                                                            }, {
                                                                readonly type: "null";
                                                            }];
                                                        };
                                                        readonly answer: {
                                                            readonly anyOf: readonly [{
                                                                readonly anyOf: readonly [{
                                                                    readonly type: "string";
                                                                }, {
                                                                    readonly type: "boolean";
                                                                    readonly const: true;
                                                                }];
                                                            }, {
                                                                readonly type: "null";
                                                            }];
                                                        };
                                                        readonly question_type: {
                                                            readonly type: "string";
                                                            readonly const: "terms";
                                                        };
                                                    };
                                                    readonly required: readonly ["label", "question_id", "value", "question_type"];
                                                }, {
                                                    readonly type: "object";
                                                    readonly properties: {
                                                        readonly label: {
                                                            readonly type: "string";
                                                        };
                                                        readonly question_id: {
                                                            readonly type: "string";
                                                        };
                                                        readonly value: {
                                                            readonly anyOf: readonly [{
                                                                readonly type: "string";
                                                            }, {
                                                                readonly type: "null";
                                                            }];
                                                        };
                                                        readonly answer: {
                                                            readonly anyOf: readonly [{
                                                                readonly type: "string";
                                                            }, {
                                                                readonly type: "null";
                                                            }];
                                                        };
                                                        readonly question_type: {
                                                            readonly anyOf: readonly [{
                                                                readonly type: "string";
                                                                readonly const: "github";
                                                            }, {
                                                                readonly type: "string";
                                                                readonly const: "instagram";
                                                            }, {
                                                                readonly type: "string";
                                                                readonly const: "linkedin";
                                                            }, {
                                                                readonly type: "string";
                                                                readonly const: "long-text";
                                                            }, {
                                                                readonly type: "string";
                                                                readonly const: "telegram";
                                                            }, {
                                                                readonly type: "string";
                                                                readonly const: "text";
                                                            }, {
                                                                readonly type: "string";
                                                                readonly const: "twitter";
                                                            }, {
                                                                readonly type: "string";
                                                                readonly const: "youtube";
                                                            }];
                                                        };
                                                    };
                                                    readonly required: readonly ["label", "question_id", "value", "question_type"];
                                                }, {
                                                    readonly type: "object";
                                                    readonly properties: {
                                                        readonly label: {
                                                            readonly type: "string";
                                                        };
                                                        readonly question_id: {
                                                            readonly type: "string";
                                                        };
                                                        readonly value: {
                                                            readonly anyOf: readonly [{
                                                                readonly type: "string";
                                                            }, {
                                                                readonly type: "null";
                                                            }];
                                                        };
                                                        readonly answer: {
                                                            readonly anyOf: readonly [{
                                                                readonly type: "string";
                                                            }, {
                                                                readonly type: "null";
                                                            }];
                                                        };
                                                        readonly question_type: {
                                                            readonly type: "string";
                                                            readonly const: "url";
                                                        };
                                                    };
                                                    readonly required: readonly ["label", "question_id", "value", "question_type"];
                                                }];
                                            };
                                        }, {
                                            readonly type: "null";
                                        }];
                                    };
                                    readonly solana_address: {
                                        readonly anyOf: readonly [{
                                            readonly type: "string";
                                            readonly pattern: "^[5KL1-9A-HJ-NP-Za-km-z]{32,44}$";
                                        }, {
                                            readonly type: "null";
                                        }];
                                    };
                                    readonly event_tickets: {
                                        readonly type: "array";
                                        readonly items: {
                                            readonly type: "object";
                                            readonly properties: {
                                                readonly id: {
                                                    readonly type: "string";
                                                };
                                                readonly amount: {
                                                    readonly type: "number";
                                                };
                                                readonly amount_discount: {
                                                    readonly type: "number";
                                                };
                                                readonly amount_tax: {
                                                    readonly type: "number";
                                                };
                                                readonly currency: {
                                                    readonly anyOf: readonly [{
                                                        readonly type: "string";
                                                        readonly enum: readonly ["solana_sol", "solana_usdc", "aed", "afn", "all", "amd", "ang", "aoa", "ars", "aud", "awg", "azn", "bam", "bbd", "bdt", "bgn", "bhd", "bif", "bmd", "bnd", "bob", "brl", "bsd", "bwp", "byn", "bzd", "cad", "cdf", "chf", "clp", "cny", "cop", "crc", "cve", "czk", "djf", "dkk", "dop", "dzd", "egp", "etb", "eur", "fjd", "fkp", "gbp", "gel", "ghs", "gip", "gmd", "gnf", "gtq", "gyd", "hkd", "hnl", "htg", "huf", "idr", "ils", "inr", "isk", "jmd", "jod", "jpy", "kes", "kgs", "khr", "kmf", "krw", "kwd", "kyd", "kzt", "lak", "lbp", "lkr", "lrd", "lsl", "mad", "mdl", "mga", "mkd", "mmk", "mnt", "mop", "mur", "mvr", "mwk", "mxn", "myr", "mzn", "nad", "ngn", "nio", "nok", "npr", "nzd", "omr", "pab", "pen", "pgk", "php", "pkr", "pln", "pyg", "qar", "ron", "rsd", "rub", "rwf", "sar", "sbd", "scr", "sek", "sgd", "shp", "sle", "sos", "srd", "std", "szl", "thb", "tjs", "tnd", "top", "try", "ttd", "twd", "tzs", "uah", "ugx", "usd", "uyu", "uzs", "vnd", "vuv", "wst", "xaf", "xcd", "xof", "xpf", "yer", "zar", "zmw"];
                                                        readonly description: "`solana_sol` `solana_usdc` `aed` `afn` `all` `amd` `ang` `aoa` `ars` `aud` `awg` `azn` `bam` `bbd` `bdt` `bgn` `bhd` `bif` `bmd` `bnd` `bob` `brl` `bsd` `bwp` `byn` `bzd` `cad` `cdf` `chf` `clp` `cny` `cop` `crc` `cve` `czk` `djf` `dkk` `dop` `dzd` `egp` `etb` `eur` `fjd` `fkp` `gbp` `gel` `ghs` `gip` `gmd` `gnf` `gtq` `gyd` `hkd` `hnl` `htg` `huf` `idr` `ils` `inr` `isk` `jmd` `jod` `jpy` `kes` `kgs` `khr` `kmf` `krw` `kwd` `kyd` `kzt` `lak` `lbp` `lkr` `lrd` `lsl` `mad` `mdl` `mga` `mkd` `mmk` `mnt` `mop` `mur` `mvr` `mwk` `mxn` `myr` `mzn` `nad` `ngn` `nio` `nok` `npr` `nzd` `omr` `pab` `pen` `pgk` `php` `pkr` `pln` `pyg` `qar` `ron` `rsd` `rub` `rwf` `sar` `sbd` `scr` `sek` `sgd` `shp` `sle` `sos` `srd` `std` `szl` `thb` `tjs` `tnd` `top` `try` `ttd` `twd` `tzs` `uah` `ugx` `usd` `uyu` `uzs` `vnd` `vuv` `wst` `xaf` `xcd` `xof` `xpf` `yer` `zar` `zmw`";
                                                    }, {
                                                        readonly type: "null";
                                                    }];
                                                };
                                                readonly checked_in_at: {
                                                    readonly anyOf: readonly [{
                                                        readonly description: "ISO 8601 Datetime. For example, 2022-10-19T03:27:13.673Z";
                                                        readonly type: "string";
                                                        readonly format: "date-time";
                                                        readonly pattern: "^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d+)?)?(?:Z|([+-](?:[01]\\d|2[0-3]):[0-5]\\d)))$";
                                                    }, {
                                                        readonly type: "null";
                                                    }];
                                                };
                                                readonly event_ticket_type_id: {
                                                    readonly type: "string";
                                                };
                                                readonly is_captured: {
                                                    readonly type: "boolean";
                                                };
                                                readonly name: {
                                                    readonly type: "string";
                                                };
                                                readonly api_id: {
                                                    readonly deprecated: true;
                                                    readonly type: "string";
                                                };
                                            };
                                            readonly required: readonly ["id", "amount", "amount_discount", "amount_tax", "currency", "checked_in_at", "event_ticket_type_id", "is_captured", "name", "api_id"];
                                        };
                                    };
                                    readonly api_id: {
                                        readonly deprecated: true;
                                        readonly type: "string";
                                    };
                                    readonly event_ticket: {
                                        readonly deprecated: true;
                                        readonly anyOf: readonly [{
                                            readonly type: "object";
                                            readonly properties: {
                                                readonly id: {
                                                    readonly type: "string";
                                                };
                                                readonly amount: {
                                                    readonly type: "number";
                                                };
                                                readonly amount_discount: {
                                                    readonly type: "number";
                                                };
                                                readonly amount_tax: {
                                                    readonly type: "number";
                                                };
                                                readonly currency: {
                                                    readonly anyOf: readonly [{
                                                        readonly type: "string";
                                                        readonly enum: readonly ["solana_sol", "solana_usdc", "aed", "afn", "all", "amd", "ang", "aoa", "ars", "aud", "awg", "azn", "bam", "bbd", "bdt", "bgn", "bhd", "bif", "bmd", "bnd", "bob", "brl", "bsd", "bwp", "byn", "bzd", "cad", "cdf", "chf", "clp", "cny", "cop", "crc", "cve", "czk", "djf", "dkk", "dop", "dzd", "egp", "etb", "eur", "fjd", "fkp", "gbp", "gel", "ghs", "gip", "gmd", "gnf", "gtq", "gyd", "hkd", "hnl", "htg", "huf", "idr", "ils", "inr", "isk", "jmd", "jod", "jpy", "kes", "kgs", "khr", "kmf", "krw", "kwd", "kyd", "kzt", "lak", "lbp", "lkr", "lrd", "lsl", "mad", "mdl", "mga", "mkd", "mmk", "mnt", "mop", "mur", "mvr", "mwk", "mxn", "myr", "mzn", "nad", "ngn", "nio", "nok", "npr", "nzd", "omr", "pab", "pen", "pgk", "php", "pkr", "pln", "pyg", "qar", "ron", "rsd", "rub", "rwf", "sar", "sbd", "scr", "sek", "sgd", "shp", "sle", "sos", "srd", "std", "szl", "thb", "tjs", "tnd", "top", "try", "ttd", "twd", "tzs", "uah", "ugx", "usd", "uyu", "uzs", "vnd", "vuv", "wst", "xaf", "xcd", "xof", "xpf", "yer", "zar", "zmw"];
                                                        readonly description: "`solana_sol` `solana_usdc` `aed` `afn` `all` `amd` `ang` `aoa` `ars` `aud` `awg` `azn` `bam` `bbd` `bdt` `bgn` `bhd` `bif` `bmd` `bnd` `bob` `brl` `bsd` `bwp` `byn` `bzd` `cad` `cdf` `chf` `clp` `cny` `cop` `crc` `cve` `czk` `djf` `dkk` `dop` `dzd` `egp` `etb` `eur` `fjd` `fkp` `gbp` `gel` `ghs` `gip` `gmd` `gnf` `gtq` `gyd` `hkd` `hnl` `htg` `huf` `idr` `ils` `inr` `isk` `jmd` `jod` `jpy` `kes` `kgs` `khr` `kmf` `krw` `kwd` `kyd` `kzt` `lak` `lbp` `lkr` `lrd` `lsl` `mad` `mdl` `mga` `mkd` `mmk` `mnt` `mop` `mur` `mvr` `mwk` `mxn` `myr` `mzn` `nad` `ngn` `nio` `nok` `npr` `nzd` `omr` `pab` `pen` `pgk` `php` `pkr` `pln` `pyg` `qar` `ron` `rsd` `rub` `rwf` `sar` `sbd` `scr` `sek` `sgd` `shp` `sle` `sos` `srd` `std` `szl` `thb` `tjs` `tnd` `top` `try` `ttd` `twd` `tzs` `uah` `ugx` `usd` `uyu` `uzs` `vnd` `vuv` `wst` `xaf` `xcd` `xof` `xpf` `yer` `zar` `zmw`";
                                                    }, {
                                                        readonly type: "null";
                                                    }];
                                                };
                                                readonly checked_in_at: {
                                                    readonly anyOf: readonly [{
                                                        readonly description: "ISO 8601 Datetime. For example, 2022-10-19T03:27:13.673Z";
                                                        readonly type: "string";
                                                        readonly format: "date-time";
                                                        readonly pattern: "^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d+)?)?(?:Z|([+-](?:[01]\\d|2[0-3]):[0-5]\\d)))$";
                                                    }, {
                                                        readonly type: "null";
                                                    }];
                                                };
                                                readonly event_ticket_type_id: {
                                                    readonly type: "string";
                                                };
                                                readonly is_captured: {
                                                    readonly type: "boolean";
                                                };
                                                readonly name: {
                                                    readonly type: "string";
                                                };
                                                readonly api_id: {
                                                    readonly deprecated: true;
                                                    readonly type: "string";
                                                };
                                            };
                                            readonly required: readonly ["id", "amount", "amount_discount", "amount_tax", "currency", "checked_in_at", "event_ticket_type_id", "is_captured", "name", "api_id"];
                                        }, {
                                            readonly type: "null";
                                        }];
                                    };
                                    readonly user_api_id: {
                                        readonly deprecated: true;
                                        readonly type: "string";
                                    };
                                    readonly checked_in_at: {
                                        readonly deprecated: true;
                                        readonly anyOf: readonly [{
                                            readonly description: "ISO 8601 Datetime. For example, 2022-10-19T03:27:13.673Z";
                                            readonly type: "string";
                                            readonly format: "date-time";
                                            readonly pattern: "^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d+)?)?(?:Z|([+-](?:[01]\\d|2[0-3]):[0-5]\\d)))$";
                                        }, {
                                            readonly type: "null";
                                        }];
                                    };
                                };
                                readonly required: readonly ["id", "user_id", "user_email", "user_name", "user_first_name", "user_last_name", "approval_status", "check_in_qr_code", "custom_source", "eth_address", "invited_at", "joined_at", "phone_number", "registered_at", "registration_answers", "solana_address", "event_tickets", "api_id", "event_ticket", "user_api_id", "checked_in_at"];
                            };
                        };
                        readonly required: readonly ["api_id", "guest"];
                    };
                };
                readonly has_more: {
                    readonly type: "boolean";
                };
                readonly next_cursor: {
                    readonly type: "string";
                };
            };
            readonly required: readonly ["entries", "has_more"];
        };
    };
};
declare const GetV1EventTicketTypesGet: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly id: {
                    readonly description: "Ticket type ID, this usually starts with ett-";
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
                readonly event_ticket_type_api_id: {
                    readonly deprecated: true;
                    readonly description: "Event ticket type API ID";
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
            };
            readonly required: readonly [];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly $schema: "https://json-schema.org/draft/2020-12/schema";
            readonly type: "object";
            readonly properties: {
                readonly ticket_type: {
                    readonly anyOf: readonly [{
                        readonly type: "object";
                        readonly required: readonly ["name", "require_approval", "ethereum_token_requirements", "type", "cents", "currency", "is_flexible", "min_cents"];
                        readonly properties: {
                            readonly name: {
                                readonly type: "string";
                            };
                            readonly require_approval: {
                                readonly type: "boolean";
                            };
                            readonly is_hidden: {
                                readonly default: false;
                                readonly type: "boolean";
                            };
                            readonly description: {
                                readonly anyOf: readonly [{
                                    readonly type: "string";
                                }, {
                                    readonly type: "null";
                                }];
                            };
                            readonly valid_start_at: {
                                readonly anyOf: readonly [{
                                    readonly type: "string";
                                }, {
                                    readonly type: "null";
                                }];
                            };
                            readonly valid_end_at: {
                                readonly anyOf: readonly [{
                                    readonly type: "string";
                                }, {
                                    readonly type: "null";
                                }];
                            };
                            readonly max_capacity: {
                                readonly anyOf: readonly [{
                                    readonly type: "number";
                                }, {
                                    readonly type: "null";
                                }];
                            };
                            readonly membership_restriction: {
                                readonly anyOf: readonly [{
                                    readonly anyOf: readonly [{
                                        readonly type: "object";
                                        readonly properties: {
                                            readonly type: {
                                                readonly type: "string";
                                                readonly const: "all-members";
                                            };
                                        };
                                        readonly required: readonly ["type"];
                                    }, {
                                        readonly type: "object";
                                        readonly properties: {
                                            readonly type: {
                                                readonly type: "string";
                                                readonly const: "memberships";
                                            };
                                            readonly calendar_membership_tier_api_ids: {
                                                readonly type: "array";
                                                readonly items: {
                                                    readonly type: "string";
                                                };
                                            };
                                        };
                                        readonly required: readonly ["type", "calendar_membership_tier_api_ids"];
                                    }];
                                }, {
                                    readonly type: "null";
                                }];
                            };
                            readonly ethereum_token_requirements: {
                                readonly type: "array";
                                readonly items: {
                                    readonly anyOf: readonly [{
                                        readonly type: "object";
                                        readonly properties: {
                                            readonly chain: {
                                                readonly type: "string";
                                                readonly const: "ethereum";
                                            };
                                            readonly type: {
                                                readonly type: "string";
                                                readonly const: "erc-721";
                                            };
                                            readonly contract: {
                                                readonly type: "object";
                                                readonly required: readonly ["type", "contract_name", "contract_address"];
                                                readonly properties: {
                                                    readonly type: {
                                                        readonly type: "string";
                                                        readonly const: "erc-721";
                                                    };
                                                    readonly contract_name: {
                                                        readonly type: "string";
                                                    };
                                                    readonly contract_address: {
                                                        readonly type: "string";
                                                        readonly pattern: "^0x[0-9a-fA-F]{40}$";
                                                    };
                                                };
                                            };
                                            readonly min_token_id: {
                                                readonly anyOf: readonly [{
                                                    readonly type: "string";
                                                    readonly pattern: "^\\d+$";
                                                }, {
                                                    readonly type: "null";
                                                }];
                                            };
                                            readonly max_token_id: {
                                                readonly anyOf: readonly [{
                                                    readonly type: "string";
                                                    readonly pattern: "^\\d+$";
                                                }, {
                                                    readonly type: "null";
                                                }];
                                            };
                                        };
                                        readonly required: readonly ["chain", "type", "contract"];
                                    }, {
                                        readonly type: "object";
                                        readonly properties: {
                                            readonly chain: {
                                                readonly type: "string";
                                                readonly const: "ethereum";
                                            };
                                            readonly type: {
                                                readonly type: "string";
                                                readonly const: "erc-20";
                                            };
                                            readonly contract: {
                                                readonly type: "object";
                                                readonly required: readonly ["type", "contract_name", "contract_address", "decimals", "symbol"];
                                                readonly properties: {
                                                    readonly type: {
                                                        readonly type: "string";
                                                        readonly const: "erc-20";
                                                    };
                                                    readonly contract_name: {
                                                        readonly anyOf: readonly [{
                                                            readonly type: "string";
                                                        }, {
                                                            readonly type: "null";
                                                        }];
                                                    };
                                                    readonly contract_address: {
                                                        readonly type: "string";
                                                        readonly pattern: "^0x[0-9a-fA-F]{40}$";
                                                    };
                                                    readonly decimals: {
                                                        readonly type: "number";
                                                    };
                                                    readonly symbol: {
                                                        readonly anyOf: readonly [{
                                                            readonly type: "string";
                                                        }, {
                                                            readonly type: "null";
                                                        }];
                                                    };
                                                    readonly image: {
                                                        readonly anyOf: readonly [{
                                                            readonly type: "string";
                                                        }, {
                                                            readonly type: "null";
                                                        }];
                                                    };
                                                };
                                            };
                                            readonly min_token_balance: {
                                                readonly anyOf: readonly [{
                                                    readonly type: "string";
                                                    readonly pattern: "^\\d+$";
                                                }, {
                                                    readonly type: "null";
                                                }];
                                            };
                                        };
                                        readonly required: readonly ["chain", "type", "contract"];
                                    }];
                                };
                            };
                            readonly type: {
                                readonly type: "string";
                                readonly const: "free";
                            };
                            readonly cents: {
                                readonly type: "null";
                            };
                            readonly currency: {
                                readonly type: "null";
                            };
                            readonly is_flexible: {
                                readonly type: "boolean";
                                readonly const: false;
                            };
                            readonly min_cents: {
                                readonly type: "null";
                            };
                            readonly api_id: {
                                readonly type: "string";
                            };
                        };
                    }, {
                        readonly type: "object";
                        readonly required: readonly ["name", "require_approval", "ethereum_token_requirements", "type", "cents", "currency", "is_flexible", "min_cents"];
                        readonly properties: {
                            readonly name: {
                                readonly type: "string";
                            };
                            readonly require_approval: {
                                readonly type: "boolean";
                            };
                            readonly is_hidden: {
                                readonly default: false;
                                readonly type: "boolean";
                            };
                            readonly description: {
                                readonly anyOf: readonly [{
                                    readonly type: "string";
                                }, {
                                    readonly type: "null";
                                }];
                            };
                            readonly valid_start_at: {
                                readonly anyOf: readonly [{
                                    readonly type: "string";
                                }, {
                                    readonly type: "null";
                                }];
                            };
                            readonly valid_end_at: {
                                readonly anyOf: readonly [{
                                    readonly type: "string";
                                }, {
                                    readonly type: "null";
                                }];
                            };
                            readonly max_capacity: {
                                readonly anyOf: readonly [{
                                    readonly type: "number";
                                }, {
                                    readonly type: "null";
                                }];
                            };
                            readonly membership_restriction: {
                                readonly anyOf: readonly [{
                                    readonly anyOf: readonly [{
                                        readonly type: "object";
                                        readonly properties: {
                                            readonly type: {
                                                readonly type: "string";
                                                readonly const: "all-members";
                                            };
                                        };
                                        readonly required: readonly ["type"];
                                    }, {
                                        readonly type: "object";
                                        readonly properties: {
                                            readonly type: {
                                                readonly type: "string";
                                                readonly const: "memberships";
                                            };
                                            readonly calendar_membership_tier_api_ids: {
                                                readonly type: "array";
                                                readonly items: {
                                                    readonly type: "string";
                                                };
                                            };
                                        };
                                        readonly required: readonly ["type", "calendar_membership_tier_api_ids"];
                                    }];
                                }, {
                                    readonly type: "null";
                                }];
                            };
                            readonly ethereum_token_requirements: {
                                readonly type: "array";
                                readonly items: {
                                    readonly anyOf: readonly [{
                                        readonly type: "object";
                                        readonly properties: {
                                            readonly chain: {
                                                readonly type: "string";
                                                readonly const: "ethereum";
                                            };
                                            readonly type: {
                                                readonly type: "string";
                                                readonly const: "erc-721";
                                            };
                                            readonly contract: {
                                                readonly type: "object";
                                                readonly required: readonly ["type", "contract_name", "contract_address"];
                                                readonly properties: {
                                                    readonly type: {
                                                        readonly type: "string";
                                                        readonly const: "erc-721";
                                                    };
                                                    readonly contract_name: {
                                                        readonly type: "string";
                                                    };
                                                    readonly contract_address: {
                                                        readonly type: "string";
                                                        readonly pattern: "^0x[0-9a-fA-F]{40}$";
                                                    };
                                                };
                                            };
                                            readonly min_token_id: {
                                                readonly anyOf: readonly [{
                                                    readonly type: "string";
                                                    readonly pattern: "^\\d+$";
                                                }, {
                                                    readonly type: "null";
                                                }];
                                            };
                                            readonly max_token_id: {
                                                readonly anyOf: readonly [{
                                                    readonly type: "string";
                                                    readonly pattern: "^\\d+$";
                                                }, {
                                                    readonly type: "null";
                                                }];
                                            };
                                        };
                                        readonly required: readonly ["chain", "type", "contract"];
                                    }, {
                                        readonly type: "object";
                                        readonly properties: {
                                            readonly chain: {
                                                readonly type: "string";
                                                readonly const: "ethereum";
                                            };
                                            readonly type: {
                                                readonly type: "string";
                                                readonly const: "erc-20";
                                            };
                                            readonly contract: {
                                                readonly type: "object";
                                                readonly required: readonly ["type", "contract_name", "contract_address", "decimals", "symbol"];
                                                readonly properties: {
                                                    readonly type: {
                                                        readonly type: "string";
                                                        readonly const: "erc-20";
                                                    };
                                                    readonly contract_name: {
                                                        readonly anyOf: readonly [{
                                                            readonly type: "string";
                                                        }, {
                                                            readonly type: "null";
                                                        }];
                                                    };
                                                    readonly contract_address: {
                                                        readonly type: "string";
                                                        readonly pattern: "^0x[0-9a-fA-F]{40}$";
                                                    };
                                                    readonly decimals: {
                                                        readonly type: "number";
                                                    };
                                                    readonly symbol: {
                                                        readonly anyOf: readonly [{
                                                            readonly type: "string";
                                                        }, {
                                                            readonly type: "null";
                                                        }];
                                                    };
                                                    readonly image: {
                                                        readonly anyOf: readonly [{
                                                            readonly type: "string";
                                                        }, {
                                                            readonly type: "null";
                                                        }];
                                                    };
                                                };
                                            };
                                            readonly min_token_balance: {
                                                readonly anyOf: readonly [{
                                                    readonly type: "string";
                                                    readonly pattern: "^\\d+$";
                                                }, {
                                                    readonly type: "null";
                                                }];
                                            };
                                        };
                                        readonly required: readonly ["chain", "type", "contract"];
                                    }];
                                };
                            };
                            readonly type: {
                                readonly type: "string";
                                readonly const: "fiat-price";
                            };
                            readonly cents: {
                                readonly type: "integer";
                                readonly minimum: 0;
                                readonly maximum: 9007199254740991;
                            };
                            readonly currency: {
                                readonly type: "string";
                                readonly enum: readonly ["solana_sol", "solana_usdc", "aed", "afn", "all", "amd", "ang", "aoa", "ars", "aud", "awg", "azn", "bam", "bbd", "bdt", "bgn", "bhd", "bif", "bmd", "bnd", "bob", "brl", "bsd", "bwp", "byn", "bzd", "cad", "cdf", "chf", "clp", "cny", "cop", "crc", "cve", "czk", "djf", "dkk", "dop", "dzd", "egp", "etb", "eur", "fjd", "fkp", "gbp", "gel", "ghs", "gip", "gmd", "gnf", "gtq", "gyd", "hkd", "hnl", "htg", "huf", "idr", "ils", "inr", "isk", "jmd", "jod", "jpy", "kes", "kgs", "khr", "kmf", "krw", "kwd", "kyd", "kzt", "lak", "lbp", "lkr", "lrd", "lsl", "mad", "mdl", "mga", "mkd", "mmk", "mnt", "mop", "mur", "mvr", "mwk", "mxn", "myr", "mzn", "nad", "ngn", "nio", "nok", "npr", "nzd", "omr", "pab", "pen", "pgk", "php", "pkr", "pln", "pyg", "qar", "ron", "rsd", "rub", "rwf", "sar", "sbd", "scr", "sek", "sgd", "shp", "sle", "sos", "srd", "std", "szl", "thb", "tjs", "tnd", "top", "try", "ttd", "twd", "tzs", "uah", "ugx", "usd", "uyu", "uzs", "vnd", "vuv", "wst", "xaf", "xcd", "xof", "xpf", "yer", "zar", "zmw"];
                                readonly description: "`solana_sol` `solana_usdc` `aed` `afn` `all` `amd` `ang` `aoa` `ars` `aud` `awg` `azn` `bam` `bbd` `bdt` `bgn` `bhd` `bif` `bmd` `bnd` `bob` `brl` `bsd` `bwp` `byn` `bzd` `cad` `cdf` `chf` `clp` `cny` `cop` `crc` `cve` `czk` `djf` `dkk` `dop` `dzd` `egp` `etb` `eur` `fjd` `fkp` `gbp` `gel` `ghs` `gip` `gmd` `gnf` `gtq` `gyd` `hkd` `hnl` `htg` `huf` `idr` `ils` `inr` `isk` `jmd` `jod` `jpy` `kes` `kgs` `khr` `kmf` `krw` `kwd` `kyd` `kzt` `lak` `lbp` `lkr` `lrd` `lsl` `mad` `mdl` `mga` `mkd` `mmk` `mnt` `mop` `mur` `mvr` `mwk` `mxn` `myr` `mzn` `nad` `ngn` `nio` `nok` `npr` `nzd` `omr` `pab` `pen` `pgk` `php` `pkr` `pln` `pyg` `qar` `ron` `rsd` `rub` `rwf` `sar` `sbd` `scr` `sek` `sgd` `shp` `sle` `sos` `srd` `std` `szl` `thb` `tjs` `tnd` `top` `try` `ttd` `twd` `tzs` `uah` `ugx` `usd` `uyu` `uzs` `vnd` `vuv` `wst` `xaf` `xcd` `xof` `xpf` `yer` `zar` `zmw`";
                            };
                            readonly is_flexible: {
                                readonly type: "boolean";
                            };
                            readonly min_cents: {
                                readonly anyOf: readonly [{
                                    readonly type: "integer";
                                    readonly minimum: 0;
                                    readonly maximum: 9007199254740991;
                                }, {
                                    readonly type: "null";
                                }];
                            };
                            readonly api_id: {
                                readonly type: "string";
                            };
                        };
                    }];
                    readonly type: "object";
                    readonly required: readonly ["api_id"];
                };
            };
            readonly required: readonly ["ticket_type"];
        };
    };
};
declare const GetV1EventTicketTypesList: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly event_id: {
                    readonly description: "Event ID, this usually starts with evt-";
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
                readonly include_hidden: {
                    readonly description: "Include hidden ticket types";
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
                readonly event_api_id: {
                    readonly deprecated: true;
                    readonly description: "Event API ID";
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
            };
            readonly required: readonly [];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly $schema: "https://json-schema.org/draft/2020-12/schema";
            readonly type: "object";
            readonly properties: {
                readonly ticket_types: {
                    readonly type: "array";
                    readonly items: {
                        readonly anyOf: readonly [{
                            readonly type: "object";
                            readonly required: readonly ["name", "require_approval", "ethereum_token_requirements", "type", "cents", "currency", "is_flexible", "min_cents"];
                            readonly properties: {
                                readonly name: {
                                    readonly type: "string";
                                };
                                readonly require_approval: {
                                    readonly type: "boolean";
                                };
                                readonly is_hidden: {
                                    readonly default: false;
                                    readonly type: "boolean";
                                };
                                readonly description: {
                                    readonly anyOf: readonly [{
                                        readonly type: "string";
                                    }, {
                                        readonly type: "null";
                                    }];
                                };
                                readonly valid_start_at: {
                                    readonly anyOf: readonly [{
                                        readonly type: "string";
                                    }, {
                                        readonly type: "null";
                                    }];
                                };
                                readonly valid_end_at: {
                                    readonly anyOf: readonly [{
                                        readonly type: "string";
                                    }, {
                                        readonly type: "null";
                                    }];
                                };
                                readonly max_capacity: {
                                    readonly anyOf: readonly [{
                                        readonly type: "number";
                                    }, {
                                        readonly type: "null";
                                    }];
                                };
                                readonly membership_restriction: {
                                    readonly anyOf: readonly [{
                                        readonly anyOf: readonly [{
                                            readonly type: "object";
                                            readonly properties: {
                                                readonly type: {
                                                    readonly type: "string";
                                                    readonly const: "all-members";
                                                };
                                            };
                                            readonly required: readonly ["type"];
                                        }, {
                                            readonly type: "object";
                                            readonly properties: {
                                                readonly type: {
                                                    readonly type: "string";
                                                    readonly const: "memberships";
                                                };
                                                readonly calendar_membership_tier_api_ids: {
                                                    readonly type: "array";
                                                    readonly items: {
                                                        readonly type: "string";
                                                    };
                                                };
                                            };
                                            readonly required: readonly ["type", "calendar_membership_tier_api_ids"];
                                        }];
                                    }, {
                                        readonly type: "null";
                                    }];
                                };
                                readonly ethereum_token_requirements: {
                                    readonly type: "array";
                                    readonly items: {
                                        readonly anyOf: readonly [{
                                            readonly type: "object";
                                            readonly properties: {
                                                readonly chain: {
                                                    readonly type: "string";
                                                    readonly const: "ethereum";
                                                };
                                                readonly type: {
                                                    readonly type: "string";
                                                    readonly const: "erc-721";
                                                };
                                                readonly contract: {
                                                    readonly type: "object";
                                                    readonly required: readonly ["type", "contract_name", "contract_address"];
                                                    readonly properties: {
                                                        readonly type: {
                                                            readonly type: "string";
                                                            readonly const: "erc-721";
                                                        };
                                                        readonly contract_name: {
                                                            readonly type: "string";
                                                        };
                                                        readonly contract_address: {
                                                            readonly type: "string";
                                                            readonly pattern: "^0x[0-9a-fA-F]{40}$";
                                                        };
                                                    };
                                                };
                                                readonly min_token_id: {
                                                    readonly anyOf: readonly [{
                                                        readonly type: "string";
                                                        readonly pattern: "^\\d+$";
                                                    }, {
                                                        readonly type: "null";
                                                    }];
                                                };
                                                readonly max_token_id: {
                                                    readonly anyOf: readonly [{
                                                        readonly type: "string";
                                                        readonly pattern: "^\\d+$";
                                                    }, {
                                                        readonly type: "null";
                                                    }];
                                                };
                                            };
                                            readonly required: readonly ["chain", "type", "contract"];
                                        }, {
                                            readonly type: "object";
                                            readonly properties: {
                                                readonly chain: {
                                                    readonly type: "string";
                                                    readonly const: "ethereum";
                                                };
                                                readonly type: {
                                                    readonly type: "string";
                                                    readonly const: "erc-20";
                                                };
                                                readonly contract: {
                                                    readonly type: "object";
                                                    readonly required: readonly ["type", "contract_name", "contract_address", "decimals", "symbol"];
                                                    readonly properties: {
                                                        readonly type: {
                                                            readonly type: "string";
                                                            readonly const: "erc-20";
                                                        };
                                                        readonly contract_name: {
                                                            readonly anyOf: readonly [{
                                                                readonly type: "string";
                                                            }, {
                                                                readonly type: "null";
                                                            }];
                                                        };
                                                        readonly contract_address: {
                                                            readonly type: "string";
                                                            readonly pattern: "^0x[0-9a-fA-F]{40}$";
                                                        };
                                                        readonly decimals: {
                                                            readonly type: "number";
                                                        };
                                                        readonly symbol: {
                                                            readonly anyOf: readonly [{
                                                                readonly type: "string";
                                                            }, {
                                                                readonly type: "null";
                                                            }];
                                                        };
                                                        readonly image: {
                                                            readonly anyOf: readonly [{
                                                                readonly type: "string";
                                                            }, {
                                                                readonly type: "null";
                                                            }];
                                                        };
                                                    };
                                                };
                                                readonly min_token_balance: {
                                                    readonly anyOf: readonly [{
                                                        readonly type: "string";
                                                        readonly pattern: "^\\d+$";
                                                    }, {
                                                        readonly type: "null";
                                                    }];
                                                };
                                            };
                                            readonly required: readonly ["chain", "type", "contract"];
                                        }];
                                    };
                                };
                                readonly type: {
                                    readonly type: "string";
                                    readonly const: "free";
                                };
                                readonly cents: {
                                    readonly type: "null";
                                };
                                readonly currency: {
                                    readonly type: "null";
                                };
                                readonly is_flexible: {
                                    readonly type: "boolean";
                                    readonly const: false;
                                };
                                readonly min_cents: {
                                    readonly type: "null";
                                };
                                readonly api_id: {
                                    readonly deprecated: true;
                                    readonly type: "string";
                                };
                                readonly id: {
                                    readonly type: "string";
                                };
                            };
                        }, {
                            readonly type: "object";
                            readonly required: readonly ["name", "require_approval", "ethereum_token_requirements", "type", "cents", "currency", "is_flexible", "min_cents"];
                            readonly properties: {
                                readonly name: {
                                    readonly type: "string";
                                };
                                readonly require_approval: {
                                    readonly type: "boolean";
                                };
                                readonly is_hidden: {
                                    readonly default: false;
                                    readonly type: "boolean";
                                };
                                readonly description: {
                                    readonly anyOf: readonly [{
                                        readonly type: "string";
                                    }, {
                                        readonly type: "null";
                                    }];
                                };
                                readonly valid_start_at: {
                                    readonly anyOf: readonly [{
                                        readonly type: "string";
                                    }, {
                                        readonly type: "null";
                                    }];
                                };
                                readonly valid_end_at: {
                                    readonly anyOf: readonly [{
                                        readonly type: "string";
                                    }, {
                                        readonly type: "null";
                                    }];
                                };
                                readonly max_capacity: {
                                    readonly anyOf: readonly [{
                                        readonly type: "number";
                                    }, {
                                        readonly type: "null";
                                    }];
                                };
                                readonly membership_restriction: {
                                    readonly anyOf: readonly [{
                                        readonly anyOf: readonly [{
                                            readonly type: "object";
                                            readonly properties: {
                                                readonly type: {
                                                    readonly type: "string";
                                                    readonly const: "all-members";
                                                };
                                            };
                                            readonly required: readonly ["type"];
                                        }, {
                                            readonly type: "object";
                                            readonly properties: {
                                                readonly type: {
                                                    readonly type: "string";
                                                    readonly const: "memberships";
                                                };
                                                readonly calendar_membership_tier_api_ids: {
                                                    readonly type: "array";
                                                    readonly items: {
                                                        readonly type: "string";
                                                    };
                                                };
                                            };
                                            readonly required: readonly ["type", "calendar_membership_tier_api_ids"];
                                        }];
                                    }, {
                                        readonly type: "null";
                                    }];
                                };
                                readonly ethereum_token_requirements: {
                                    readonly type: "array";
                                    readonly items: {
                                        readonly anyOf: readonly [{
                                            readonly type: "object";
                                            readonly properties: {
                                                readonly chain: {
                                                    readonly type: "string";
                                                    readonly const: "ethereum";
                                                };
                                                readonly type: {
                                                    readonly type: "string";
                                                    readonly const: "erc-721";
                                                };
                                                readonly contract: {
                                                    readonly type: "object";
                                                    readonly required: readonly ["type", "contract_name", "contract_address"];
                                                    readonly properties: {
                                                        readonly type: {
                                                            readonly type: "string";
                                                            readonly const: "erc-721";
                                                        };
                                                        readonly contract_name: {
                                                            readonly type: "string";
                                                        };
                                                        readonly contract_address: {
                                                            readonly type: "string";
                                                            readonly pattern: "^0x[0-9a-fA-F]{40}$";
                                                        };
                                                    };
                                                };
                                                readonly min_token_id: {
                                                    readonly anyOf: readonly [{
                                                        readonly type: "string";
                                                        readonly pattern: "^\\d+$";
                                                    }, {
                                                        readonly type: "null";
                                                    }];
                                                };
                                                readonly max_token_id: {
                                                    readonly anyOf: readonly [{
                                                        readonly type: "string";
                                                        readonly pattern: "^\\d+$";
                                                    }, {
                                                        readonly type: "null";
                                                    }];
                                                };
                                            };
                                            readonly required: readonly ["chain", "type", "contract"];
                                        }, {
                                            readonly type: "object";
                                            readonly properties: {
                                                readonly chain: {
                                                    readonly type: "string";
                                                    readonly const: "ethereum";
                                                };
                                                readonly type: {
                                                    readonly type: "string";
                                                    readonly const: "erc-20";
                                                };
                                                readonly contract: {
                                                    readonly type: "object";
                                                    readonly required: readonly ["type", "contract_name", "contract_address", "decimals", "symbol"];
                                                    readonly properties: {
                                                        readonly type: {
                                                            readonly type: "string";
                                                            readonly const: "erc-20";
                                                        };
                                                        readonly contract_name: {
                                                            readonly anyOf: readonly [{
                                                                readonly type: "string";
                                                            }, {
                                                                readonly type: "null";
                                                            }];
                                                        };
                                                        readonly contract_address: {
                                                            readonly type: "string";
                                                            readonly pattern: "^0x[0-9a-fA-F]{40}$";
                                                        };
                                                        readonly decimals: {
                                                            readonly type: "number";
                                                        };
                                                        readonly symbol: {
                                                            readonly anyOf: readonly [{
                                                                readonly type: "string";
                                                            }, {
                                                                readonly type: "null";
                                                            }];
                                                        };
                                                        readonly image: {
                                                            readonly anyOf: readonly [{
                                                                readonly type: "string";
                                                            }, {
                                                                readonly type: "null";
                                                            }];
                                                        };
                                                    };
                                                };
                                                readonly min_token_balance: {
                                                    readonly anyOf: readonly [{
                                                        readonly type: "string";
                                                        readonly pattern: "^\\d+$";
                                                    }, {
                                                        readonly type: "null";
                                                    }];
                                                };
                                            };
                                            readonly required: readonly ["chain", "type", "contract"];
                                        }];
                                    };
                                };
                                readonly type: {
                                    readonly type: "string";
                                    readonly const: "fiat-price";
                                };
                                readonly cents: {
                                    readonly type: "integer";
                                    readonly minimum: 0;
                                    readonly maximum: 9007199254740991;
                                };
                                readonly currency: {
                                    readonly type: "string";
                                    readonly enum: readonly ["solana_sol", "solana_usdc", "aed", "afn", "all", "amd", "ang", "aoa", "ars", "aud", "awg", "azn", "bam", "bbd", "bdt", "bgn", "bhd", "bif", "bmd", "bnd", "bob", "brl", "bsd", "bwp", "byn", "bzd", "cad", "cdf", "chf", "clp", "cny", "cop", "crc", "cve", "czk", "djf", "dkk", "dop", "dzd", "egp", "etb", "eur", "fjd", "fkp", "gbp", "gel", "ghs", "gip", "gmd", "gnf", "gtq", "gyd", "hkd", "hnl", "htg", "huf", "idr", "ils", "inr", "isk", "jmd", "jod", "jpy", "kes", "kgs", "khr", "kmf", "krw", "kwd", "kyd", "kzt", "lak", "lbp", "lkr", "lrd", "lsl", "mad", "mdl", "mga", "mkd", "mmk", "mnt", "mop", "mur", "mvr", "mwk", "mxn", "myr", "mzn", "nad", "ngn", "nio", "nok", "npr", "nzd", "omr", "pab", "pen", "pgk", "php", "pkr", "pln", "pyg", "qar", "ron", "rsd", "rub", "rwf", "sar", "sbd", "scr", "sek", "sgd", "shp", "sle", "sos", "srd", "std", "szl", "thb", "tjs", "tnd", "top", "try", "ttd", "twd", "tzs", "uah", "ugx", "usd", "uyu", "uzs", "vnd", "vuv", "wst", "xaf", "xcd", "xof", "xpf", "yer", "zar", "zmw"];
                                    readonly description: "`solana_sol` `solana_usdc` `aed` `afn` `all` `amd` `ang` `aoa` `ars` `aud` `awg` `azn` `bam` `bbd` `bdt` `bgn` `bhd` `bif` `bmd` `bnd` `bob` `brl` `bsd` `bwp` `byn` `bzd` `cad` `cdf` `chf` `clp` `cny` `cop` `crc` `cve` `czk` `djf` `dkk` `dop` `dzd` `egp` `etb` `eur` `fjd` `fkp` `gbp` `gel` `ghs` `gip` `gmd` `gnf` `gtq` `gyd` `hkd` `hnl` `htg` `huf` `idr` `ils` `inr` `isk` `jmd` `jod` `jpy` `kes` `kgs` `khr` `kmf` `krw` `kwd` `kyd` `kzt` `lak` `lbp` `lkr` `lrd` `lsl` `mad` `mdl` `mga` `mkd` `mmk` `mnt` `mop` `mur` `mvr` `mwk` `mxn` `myr` `mzn` `nad` `ngn` `nio` `nok` `npr` `nzd` `omr` `pab` `pen` `pgk` `php` `pkr` `pln` `pyg` `qar` `ron` `rsd` `rub` `rwf` `sar` `sbd` `scr` `sek` `sgd` `shp` `sle` `sos` `srd` `std` `szl` `thb` `tjs` `tnd` `top` `try` `ttd` `twd` `tzs` `uah` `ugx` `usd` `uyu` `uzs` `vnd` `vuv` `wst` `xaf` `xcd` `xof` `xpf` `yer` `zar` `zmw`";
                                };
                                readonly is_flexible: {
                                    readonly type: "boolean";
                                };
                                readonly min_cents: {
                                    readonly anyOf: readonly [{
                                        readonly type: "integer";
                                        readonly minimum: 0;
                                        readonly maximum: 9007199254740991;
                                    }, {
                                        readonly type: "null";
                                    }];
                                };
                                readonly api_id: {
                                    readonly deprecated: true;
                                    readonly type: "string";
                                };
                                readonly id: {
                                    readonly type: "string";
                                };
                            };
                        }];
                        readonly type: "object";
                        readonly required: readonly ["api_id", "id"];
                    };
                };
            };
            readonly required: readonly ["ticket_types"];
        };
    };
};
declare const GetV1MembershipsTiersList: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly pagination_cursor: {
                    readonly description: "Value of `next_cursor` from a previous request.";
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
                readonly pagination_limit: {
                    readonly description: "The number of items to return. The server will enforce a maximum number.";
                    readonly type: "number";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
            };
            readonly required: readonly [];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly $schema: "https://json-schema.org/draft/2020-12/schema";
            readonly type: "object";
            readonly properties: {
                readonly entries: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly id: {
                                readonly type: "string";
                            };
                            readonly name: {
                                readonly type: "string";
                            };
                            readonly description: {
                                readonly anyOf: readonly [{
                                    readonly type: "string";
                                }, {
                                    readonly type: "null";
                                }];
                            };
                            readonly tint_color: {
                                readonly description: "A hex color like '#bb2dc7'. Alpha channels (#rgba, #rrggbbaa) are automatically stripped.";
                                readonly type: "string";
                            };
                            readonly access_info: {
                                readonly anyOf: readonly [{
                                    readonly type: "object";
                                    readonly properties: {
                                        readonly type: {
                                            readonly type: "string";
                                            readonly const: "free";
                                        };
                                        readonly require_approval: {
                                            readonly type: "boolean";
                                        };
                                    };
                                    readonly required: readonly ["type", "require_approval"];
                                }, {
                                    readonly type: "object";
                                    readonly properties: {
                                        readonly type: {
                                            readonly type: "string";
                                            readonly const: "payment-once";
                                        };
                                        readonly amount: {
                                            readonly type: "number";
                                            readonly exclusiveMinimum: 0;
                                        };
                                        readonly currency: {
                                            readonly type: "string";
                                            readonly enum: readonly ["solana_sol", "solana_usdc", "aed", "afn", "all", "amd", "ang", "aoa", "ars", "aud", "awg", "azn", "bam", "bbd", "bdt", "bgn", "bhd", "bif", "bmd", "bnd", "bob", "brl", "bsd", "bwp", "byn", "bzd", "cad", "cdf", "chf", "clp", "cny", "cop", "crc", "cve", "czk", "djf", "dkk", "dop", "dzd", "egp", "etb", "eur", "fjd", "fkp", "gbp", "gel", "ghs", "gip", "gmd", "gnf", "gtq", "gyd", "hkd", "hnl", "htg", "huf", "idr", "ils", "inr", "isk", "jmd", "jod", "jpy", "kes", "kgs", "khr", "kmf", "krw", "kwd", "kyd", "kzt", "lak", "lbp", "lkr", "lrd", "lsl", "mad", "mdl", "mga", "mkd", "mmk", "mnt", "mop", "mur", "mvr", "mwk", "mxn", "myr", "mzn", "nad", "ngn", "nio", "nok", "npr", "nzd", "omr", "pab", "pen", "pgk", "php", "pkr", "pln", "pyg", "qar", "ron", "rsd", "rub", "rwf", "sar", "sbd", "scr", "sek", "sgd", "shp", "sle", "sos", "srd", "std", "szl", "thb", "tjs", "tnd", "top", "try", "ttd", "twd", "tzs", "uah", "ugx", "usd", "uyu", "uzs", "vnd", "vuv", "wst", "xaf", "xcd", "xof", "xpf", "yer", "zar", "zmw"];
                                            readonly description: "`solana_sol` `solana_usdc` `aed` `afn` `all` `amd` `ang` `aoa` `ars` `aud` `awg` `azn` `bam` `bbd` `bdt` `bgn` `bhd` `bif` `bmd` `bnd` `bob` `brl` `bsd` `bwp` `byn` `bzd` `cad` `cdf` `chf` `clp` `cny` `cop` `crc` `cve` `czk` `djf` `dkk` `dop` `dzd` `egp` `etb` `eur` `fjd` `fkp` `gbp` `gel` `ghs` `gip` `gmd` `gnf` `gtq` `gyd` `hkd` `hnl` `htg` `huf` `idr` `ils` `inr` `isk` `jmd` `jod` `jpy` `kes` `kgs` `khr` `kmf` `krw` `kwd` `kyd` `kzt` `lak` `lbp` `lkr` `lrd` `lsl` `mad` `mdl` `mga` `mkd` `mmk` `mnt` `mop` `mur` `mvr` `mwk` `mxn` `myr` `mzn` `nad` `ngn` `nio` `nok` `npr` `nzd` `omr` `pab` `pen` `pgk` `php` `pkr` `pln` `pyg` `qar` `ron` `rsd` `rub` `rwf` `sar` `sbd` `scr` `sek` `sgd` `shp` `sle` `sos` `srd` `std` `szl` `thb` `tjs` `tnd` `top` `try` `ttd` `twd` `tzs` `uah` `ugx` `usd` `uyu` `uzs` `vnd` `vuv` `wst` `xaf` `xcd` `xof` `xpf` `yer` `zar` `zmw`";
                                        };
                                        readonly require_approval: {
                                            readonly type: "boolean";
                                        };
                                    };
                                    readonly required: readonly ["type", "amount", "currency", "require_approval"];
                                }, {
                                    readonly type: "object";
                                    readonly properties: {
                                        readonly type: {
                                            readonly type: "string";
                                            readonly const: "payment-recurring";
                                        };
                                        readonly currency: {
                                            readonly type: "string";
                                            readonly enum: readonly ["solana_sol", "solana_usdc", "aed", "afn", "all", "amd", "ang", "aoa", "ars", "aud", "awg", "azn", "bam", "bbd", "bdt", "bgn", "bhd", "bif", "bmd", "bnd", "bob", "brl", "bsd", "bwp", "byn", "bzd", "cad", "cdf", "chf", "clp", "cny", "cop", "crc", "cve", "czk", "djf", "dkk", "dop", "dzd", "egp", "etb", "eur", "fjd", "fkp", "gbp", "gel", "ghs", "gip", "gmd", "gnf", "gtq", "gyd", "hkd", "hnl", "htg", "huf", "idr", "ils", "inr", "isk", "jmd", "jod", "jpy", "kes", "kgs", "khr", "kmf", "krw", "kwd", "kyd", "kzt", "lak", "lbp", "lkr", "lrd", "lsl", "mad", "mdl", "mga", "mkd", "mmk", "mnt", "mop", "mur", "mvr", "mwk", "mxn", "myr", "mzn", "nad", "ngn", "nio", "nok", "npr", "nzd", "omr", "pab", "pen", "pgk", "php", "pkr", "pln", "pyg", "qar", "ron", "rsd", "rub", "rwf", "sar", "sbd", "scr", "sek", "sgd", "shp", "sle", "sos", "srd", "std", "szl", "thb", "tjs", "tnd", "top", "try", "ttd", "twd", "tzs", "uah", "ugx", "usd", "uyu", "uzs", "vnd", "vuv", "wst", "xaf", "xcd", "xof", "xpf", "yer", "zar", "zmw"];
                                            readonly description: "`solana_sol` `solana_usdc` `aed` `afn` `all` `amd` `ang` `aoa` `ars` `aud` `awg` `azn` `bam` `bbd` `bdt` `bgn` `bhd` `bif` `bmd` `bnd` `bob` `brl` `bsd` `bwp` `byn` `bzd` `cad` `cdf` `chf` `clp` `cny` `cop` `crc` `cve` `czk` `djf` `dkk` `dop` `dzd` `egp` `etb` `eur` `fjd` `fkp` `gbp` `gel` `ghs` `gip` `gmd` `gnf` `gtq` `gyd` `hkd` `hnl` `htg` `huf` `idr` `ils` `inr` `isk` `jmd` `jod` `jpy` `kes` `kgs` `khr` `kmf` `krw` `kwd` `kyd` `kzt` `lak` `lbp` `lkr` `lrd` `lsl` `mad` `mdl` `mga` `mkd` `mmk` `mnt` `mop` `mur` `mvr` `mwk` `mxn` `myr` `mzn` `nad` `ngn` `nio` `nok` `npr` `nzd` `omr` `pab` `pen` `pgk` `php` `pkr` `pln` `pyg` `qar` `ron` `rsd` `rub` `rwf` `sar` `sbd` `scr` `sek` `sgd` `shp` `sle` `sos` `srd` `std` `szl` `thb` `tjs` `tnd` `top` `try` `ttd` `twd` `tzs` `uah` `ugx` `usd` `uyu` `uzs` `vnd` `vuv` `wst` `xaf` `xcd` `xof` `xpf` `yer` `zar` `zmw`";
                                        };
                                        readonly stripe_account_id: {
                                            readonly type: "string";
                                        };
                                        readonly stripe_product_id: {
                                            readonly type: "string";
                                        };
                                        readonly stripe_monthly_price_id: {
                                            readonly anyOf: readonly [{
                                                readonly type: "string";
                                            }, {
                                                readonly type: "null";
                                            }];
                                        };
                                        readonly amount_monthly: {
                                            readonly anyOf: readonly [{
                                                readonly type: "number";
                                                readonly exclusiveMinimum: 0;
                                            }, {
                                                readonly type: "null";
                                            }];
                                        };
                                        readonly stripe_yearly_price_id: {
                                            readonly anyOf: readonly [{
                                                readonly type: "string";
                                            }, {
                                                readonly type: "null";
                                            }];
                                        };
                                        readonly amount_yearly: {
                                            readonly anyOf: readonly [{
                                                readonly type: "number";
                                                readonly exclusiveMinimum: 0;
                                            }, {
                                                readonly type: "null";
                                            }];
                                        };
                                        readonly require_approval: {
                                            readonly type: "boolean";
                                        };
                                    };
                                    readonly required: readonly ["type", "currency", "stripe_account_id", "stripe_product_id", "require_approval"];
                                }];
                            };
                        };
                        readonly required: readonly ["id", "name", "description", "tint_color", "access_info"];
                    };
                };
                readonly has_more: {
                    readonly type: "boolean";
                };
                readonly next_cursor: {
                    readonly type: "string";
                };
            };
            readonly required: readonly ["entries", "has_more"];
        };
    };
};
declare const GetV1UserGetSelf: {
    readonly response: {
        readonly "200": {
            readonly $schema: "https://json-schema.org/draft/2020-12/schema";
            readonly type: "object";
            readonly properties: {
                readonly user: {
                    readonly type: "object";
                    readonly properties: {
                        readonly id: {
                            readonly type: "string";
                        };
                        readonly name: {
                            readonly anyOf: readonly [{
                                readonly type: "string";
                            }, {
                                readonly type: "null";
                            }];
                        };
                        readonly avatar_url: {
                            readonly type: "string";
                        };
                        readonly email: {
                            readonly type: "string";
                        };
                        readonly first_name: {
                            readonly anyOf: readonly [{
                                readonly type: "string";
                            }, {
                                readonly type: "null";
                            }];
                        };
                        readonly last_name: {
                            readonly anyOf: readonly [{
                                readonly type: "string";
                            }, {
                                readonly type: "null";
                            }];
                        };
                        readonly api_id: {
                            readonly deprecated: true;
                            readonly type: "string";
                        };
                    };
                    readonly required: readonly ["id", "name", "avatar_url", "email", "first_name", "last_name", "api_id"];
                };
            };
            readonly required: readonly ["user"];
        };
    };
};
declare const GetV1WebhooksGet: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly id: {
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
            };
            readonly required: readonly ["id"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly $schema: "https://json-schema.org/draft/2020-12/schema";
            readonly type: "object";
            readonly properties: {
                readonly webhook: {
                    readonly type: "object";
                    readonly properties: {
                        readonly id: {
                            readonly type: "string";
                        };
                        readonly url: {
                            readonly type: "string";
                        };
                        readonly event_types: {
                            readonly type: "array";
                            readonly items: {
                                readonly type: "string";
                                readonly enum: readonly ["*", "calendar.event.added", "calendar.person.subscribed", "event.created", "event.updated", "guest.registered", "guest.updated", "ticket.registered"];
                                readonly description: "`*` `calendar.event.added` `calendar.person.subscribed` `event.created` `event.updated` `guest.registered` `guest.updated` `ticket.registered`";
                            };
                        };
                        readonly status: {
                            readonly type: "string";
                            readonly enum: readonly ["active", "paused"];
                            readonly description: "`active` `paused`";
                        };
                        readonly secret: {
                            readonly type: "string";
                        };
                        readonly created_at: {
                            readonly description: "ISO 8601 Datetime. For example, 2022-10-19T03:27:13.673Z";
                            readonly type: "string";
                            readonly format: "date-time";
                            readonly pattern: "^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d+)?)?(?:Z|([+-](?:[01]\\d|2[0-3]):[0-5]\\d)))$";
                        };
                    };
                    readonly required: readonly ["id", "url", "event_types", "status", "secret", "created_at"];
                };
            };
            readonly required: readonly ["webhook"];
        };
    };
};
declare const GetV1WebhooksList: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly pagination_cursor: {
                    readonly description: "Value of `next_cursor` from a previous request.";
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
                readonly pagination_limit: {
                    readonly description: "The number of items to return. The server will enforce a maximum number.";
                    readonly type: "number";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
            };
            readonly required: readonly [];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly $schema: "https://json-schema.org/draft/2020-12/schema";
            readonly type: "object";
            readonly properties: {
                readonly entries: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly id: {
                                readonly type: "string";
                            };
                            readonly url: {
                                readonly type: "string";
                            };
                            readonly event_types: {
                                readonly type: "array";
                                readonly items: {
                                    readonly type: "string";
                                    readonly enum: readonly ["*", "calendar.event.added", "calendar.person.subscribed", "event.created", "event.updated", "guest.registered", "guest.updated", "ticket.registered"];
                                    readonly description: "`*` `calendar.event.added` `calendar.person.subscribed` `event.created` `event.updated` `guest.registered` `guest.updated` `ticket.registered`";
                                };
                            };
                            readonly status: {
                                readonly type: "string";
                                readonly enum: readonly ["active", "paused"];
                                readonly description: "`active` `paused`";
                            };
                            readonly secret: {
                                readonly type: "string";
                            };
                            readonly created_at: {
                                readonly description: "ISO 8601 Datetime. For example, 2022-10-19T03:27:13.673Z";
                                readonly type: "string";
                                readonly format: "date-time";
                                readonly pattern: "^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d+)?)?(?:Z|([+-](?:[01]\\d|2[0-3]):[0-5]\\d)))$";
                            };
                        };
                        readonly required: readonly ["id", "url", "event_types", "status", "secret", "created_at"];
                    };
                };
                readonly has_more: {
                    readonly type: "boolean";
                };
                readonly next_cursor: {
                    readonly type: "string";
                };
            };
            readonly required: readonly ["entries", "has_more"];
        };
    };
};
declare const PostV1CalendarAddEvent: {
    readonly body: {
        readonly $schema: "https://json-schema.org/draft/2020-12/schema";
        readonly anyOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly platform: {
                    readonly type: "string";
                    readonly const: "external";
                };
                readonly url: {
                    readonly type: "string";
                };
                readonly name: {
                    readonly type: "string";
                };
                readonly start_at: {
                    readonly description: "ISO 8601 Datetime. For example, 2022-10-19T03:27:13.673Z";
                    readonly type: "string";
                    readonly format: "date-time";
                    readonly pattern: "^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d+)?)?(?:Z|([+-](?:[01]\\d|2[0-3]):[0-5]\\d)))$";
                };
                readonly duration_interval: {
                    readonly type: "string";
                };
                readonly timezone: {
                    readonly description: "IANA Timezone, e.g. America/New_York. https://en.wikipedia.org/wiki/List_of_tz_database_time_zones";
                    readonly type: "string";
                };
                readonly geo_address_json: {
                    readonly anyOf: readonly [{
                        readonly anyOf: readonly [{
                            readonly type: "object";
                            readonly properties: {
                                readonly type: {
                                    readonly type: "string";
                                    readonly const: "manual";
                                };
                                readonly address: {
                                    readonly type: "string";
                                };
                            };
                            readonly required: readonly ["type", "address"];
                        }, {
                            readonly type: "object";
                            readonly properties: {
                                readonly type: {
                                    readonly type: "string";
                                    readonly const: "google";
                                };
                                readonly place_id: {
                                    readonly type: "string";
                                };
                                readonly description: {
                                    readonly anyOf: readonly [{
                                        readonly type: "string";
                                    }, {
                                        readonly type: "null";
                                    }];
                                };
                            };
                            readonly required: readonly ["type", "place_id"];
                        }];
                    }, {
                        readonly type: "null";
                    }];
                };
                readonly host: {
                    readonly anyOf: readonly [{
                        readonly type: "string";
                    }, {
                        readonly type: "null";
                    }];
                };
                readonly geo_longitude: {
                    readonly anyOf: readonly [{
                        readonly type: "number";
                    }, {
                        readonly type: "null";
                    }];
                };
                readonly geo_latitude: {
                    readonly anyOf: readonly [{
                        readonly type: "number";
                    }, {
                        readonly type: "null";
                    }];
                };
                readonly coordinate: {
                    readonly anyOf: readonly [{
                        readonly type: "object";
                        readonly properties: {
                            readonly longitude: {
                                readonly type: "number";
                            };
                            readonly latitude: {
                                readonly type: "number";
                            };
                        };
                        readonly required: readonly ["longitude", "latitude"];
                    }, {
                        readonly type: "null";
                    }];
                };
            };
            readonly required: readonly ["platform", "url", "name", "start_at", "duration_interval", "timezone"];
        }, {
            readonly type: "object";
            readonly properties: {
                readonly platform: {
                    readonly type: "string";
                    readonly const: "luma";
                };
                readonly event_api_id: {
                    readonly type: "string";
                };
            };
            readonly required: readonly ["platform", "event_api_id"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly $schema: "https://json-schema.org/draft/2020-12/schema";
            readonly type: "object";
            readonly properties: {
                readonly api_id: {
                    readonly type: "string";
                };
            };
            readonly required: readonly ["api_id"];
        };
    };
};
declare const PostV1CalendarCouponsCreate: {
    readonly body: {
        readonly $schema: "https://json-schema.org/draft/2020-12/schema";
        readonly type: "object";
        readonly properties: {
            readonly code: {
                readonly description: "This is the code that the user will enter on the event page. It is not case sensitive. Maximum 20 characters.";
                readonly type: "string";
                readonly minLength: 1;
                readonly maxLength: 20;
            };
            readonly remaining_count: {
                readonly description: "Number of times the coupon can be used. Set to 1000000 for unlimited uses.";
                readonly type: "integer";
                readonly minimum: 0;
                readonly maximum: 1000000;
            };
            readonly valid_start_at: {
                readonly anyOf: readonly [{
                    readonly description: "ISO 8601 Datetime. For example, 2022-10-19T03:27:13.673Z";
                    readonly type: "string";
                    readonly format: "date-time";
                    readonly pattern: "^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d+)?)?(?:Z|([+-](?:[01]\\d|2[0-3]):[0-5]\\d)))$";
                }, {
                    readonly type: "null";
                }];
            };
            readonly valid_end_at: {
                readonly anyOf: readonly [{
                    readonly description: "ISO 8601 Datetime. For example, 2022-10-19T03:27:13.673Z";
                    readonly type: "string";
                    readonly format: "date-time";
                    readonly pattern: "^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d+)?)?(?:Z|([+-](?:[01]\\d|2[0-3]):[0-5]\\d)))$";
                }, {
                    readonly type: "null";
                }];
            };
            readonly discount: {
                readonly anyOf: readonly [{
                    readonly type: "object";
                    readonly properties: {
                        readonly discount_type: {
                            readonly type: "string";
                            readonly const: "percent";
                        };
                        readonly percent_off: {
                            readonly type: "number";
                            readonly minimum: 0;
                            readonly maximum: 100;
                        };
                    };
                    readonly required: readonly ["discount_type", "percent_off"];
                }, {
                    readonly type: "object";
                    readonly properties: {
                        readonly discount_type: {
                            readonly type: "string";
                            readonly const: "amount";
                        };
                        readonly cents_off: {
                            readonly type: "number";
                            readonly minimum: 0;
                        };
                        readonly currency: {
                            readonly type: "string";
                            readonly enum: readonly ["solana_sol", "solana_usdc", "aed", "afn", "all", "amd", "ang", "aoa", "ars", "aud", "awg", "azn", "bam", "bbd", "bdt", "bgn", "bhd", "bif", "bmd", "bnd", "bob", "brl", "bsd", "bwp", "byn", "bzd", "cad", "cdf", "chf", "clp", "cny", "cop", "crc", "cve", "czk", "djf", "dkk", "dop", "dzd", "egp", "etb", "eur", "fjd", "fkp", "gbp", "gel", "ghs", "gip", "gmd", "gnf", "gtq", "gyd", "hkd", "hnl", "htg", "huf", "idr", "ils", "inr", "isk", "jmd", "jod", "jpy", "kes", "kgs", "khr", "kmf", "krw", "kwd", "kyd", "kzt", "lak", "lbp", "lkr", "lrd", "lsl", "mad", "mdl", "mga", "mkd", "mmk", "mnt", "mop", "mur", "mvr", "mwk", "mxn", "myr", "mzn", "nad", "ngn", "nio", "nok", "npr", "nzd", "omr", "pab", "pen", "pgk", "php", "pkr", "pln", "pyg", "qar", "ron", "rsd", "rub", "rwf", "sar", "sbd", "scr", "sek", "sgd", "shp", "sle", "sos", "srd", "std", "szl", "thb", "tjs", "tnd", "top", "try", "ttd", "twd", "tzs", "uah", "ugx", "usd", "uyu", "uzs", "vnd", "vuv", "wst", "xaf", "xcd", "xof", "xpf", "yer", "zar", "zmw"];
                        };
                    };
                    readonly required: readonly ["discount_type", "cents_off", "currency"];
                }];
            };
        };
        readonly required: readonly ["code", "discount"];
    };
    readonly response: {
        readonly "200": {
            readonly $schema: "https://json-schema.org/draft/2020-12/schema";
            readonly type: "object";
            readonly properties: {
                readonly coupon: {
                    readonly type: "object";
                    readonly properties: {
                        readonly api_id: {
                            readonly type: "string";
                        };
                    };
                    readonly required: readonly ["api_id"];
                };
            };
            readonly required: readonly ["coupon"];
        };
    };
};
declare const PostV1CalendarCouponsUpdate: {
    readonly body: {
        readonly $schema: "https://json-schema.org/draft/2020-12/schema";
        readonly type: "object";
        readonly properties: {
            readonly code: {
                readonly type: "string";
            };
            readonly remaining_count: {
                readonly type: "integer";
                readonly minimum: -9007199254740991;
                readonly maximum: 9007199254740991;
            };
            readonly valid_start_at: {
                readonly anyOf: readonly [{
                    readonly description: "ISO 8601 Datetime. For example, 2022-10-19T03:27:13.673Z";
                    readonly type: "string";
                    readonly format: "date-time";
                    readonly pattern: "^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d+)?)?(?:Z|([+-](?:[01]\\d|2[0-3]):[0-5]\\d)))$";
                }, {
                    readonly type: "null";
                }];
            };
            readonly valid_end_at: {
                readonly anyOf: readonly [{
                    readonly description: "ISO 8601 Datetime. For example, 2022-10-19T03:27:13.673Z";
                    readonly type: "string";
                    readonly format: "date-time";
                    readonly pattern: "^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d+)?)?(?:Z|([+-](?:[01]\\d|2[0-3]):[0-5]\\d)))$";
                }, {
                    readonly type: "null";
                }];
            };
        };
        readonly required: readonly ["code"];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly description: "Empty response";
            readonly properties: {};
            readonly additionalProperties: false;
            readonly "x-stainless-empty-object": true;
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const PostV1CalendarCreatePersonTag: {
    readonly body: {
        readonly $schema: "https://json-schema.org/draft/2020-12/schema";
        readonly type: "object";
        readonly properties: {
            readonly name: {
                readonly type: "string";
            };
            readonly color: {
                readonly anyOf: readonly [{
                    readonly type: "string";
                    readonly enum: readonly ["cranberry", "barney", "red", "green", "blue", "purple", "yellow", "orange"];
                }, {
                    readonly type: "null";
                }];
            };
        };
        readonly required: readonly ["name"];
    };
    readonly response: {
        readonly "200": {
            readonly $schema: "https://json-schema.org/draft/2020-12/schema";
            readonly type: "object";
            readonly properties: {
                readonly tag_api_id: {
                    readonly type: "string";
                };
            };
            readonly required: readonly ["tag_api_id"];
        };
    };
};
declare const PostV1CalendarDeletePersonTag: {
    readonly body: {
        readonly $schema: "https://json-schema.org/draft/2020-12/schema";
        readonly type: "object";
        readonly properties: {
            readonly tag_api_id: {
                readonly type: "string";
            };
        };
        readonly required: readonly ["tag_api_id"];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly description: "Empty response";
            readonly properties: {};
            readonly additionalProperties: false;
            readonly "x-stainless-empty-object": true;
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const PostV1CalendarImportPeople: {
    readonly body: {
        readonly $schema: "https://json-schema.org/draft/2020-12/schema";
        readonly type: "object";
        readonly properties: {
            readonly infos: {
                readonly description: "Information about the people you want to import. You can include a name and email. Note that we will not set the name of a user once it has already been set.";
                readonly type: "array";
                readonly items: {
                    readonly type: "object";
                    readonly properties: {
                        readonly email: {
                            readonly type: "string";
                        };
                        readonly name: {
                            readonly anyOf: readonly [{
                                readonly type: "string";
                            }, {
                                readonly type: "null";
                            }];
                        };
                    };
                    readonly required: readonly ["email"];
                };
            };
            readonly tag_api_ids: {
                readonly description: "The list of tags to apply to people once you have imported them into your calendar. This can be used to import new members with tags and to tag existing members.";
                readonly anyOf: readonly [{
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                }, {
                    readonly type: "null";
                }];
            };
            readonly tag_names: {
                readonly description: "Note: we will not create tags that do not exist. If you want to use a new tag, create a tag before importing people.";
                readonly anyOf: readonly [{
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                }, {
                    readonly type: "null";
                }];
            };
        };
        readonly required: readonly ["infos"];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly description: "Empty response";
            readonly properties: {};
            readonly additionalProperties: false;
            readonly "x-stainless-empty-object": true;
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const PostV1CalendarPersonTagsApply: {
    readonly body: {
        readonly $schema: "https://json-schema.org/draft/2020-12/schema";
        readonly type: "object";
        readonly properties: {
            readonly tag: {
                readonly description: "Tag API ID (e.g., 'tag-123') or tag name";
                readonly type: "string";
            };
            readonly user_api_ids: {
                readonly description: "Array of user API IDs to apply the tag to";
                readonly type: "array";
                readonly items: {
                    readonly type: "string";
                };
            };
            readonly emails: {
                readonly description: "Array of email addresses to apply the tag to";
                readonly type: "array";
                readonly items: {
                    readonly type: "string";
                };
            };
        };
        readonly required: readonly ["tag"];
    };
    readonly response: {
        readonly "200": {
            readonly $schema: "https://json-schema.org/draft/2020-12/schema";
            readonly type: "object";
            readonly properties: {
                readonly applied_count: {
                    readonly description: "Number of members the tag was successfully applied to";
                    readonly type: "number";
                };
                readonly skipped_count: {
                    readonly description: "Number of users skipped because they are not calendar members";
                    readonly type: "number";
                };
            };
            readonly required: readonly ["applied_count", "skipped_count"];
        };
    };
};
declare const PostV1CalendarPersonTagsUnapply: {
    readonly body: {
        readonly $schema: "https://json-schema.org/draft/2020-12/schema";
        readonly type: "object";
        readonly properties: {
            readonly tag: {
                readonly description: "Tag API ID (e.g., 'tag-123') or tag name";
                readonly type: "string";
            };
            readonly user_api_ids: {
                readonly description: "Array of user API IDs to remove the tag from";
                readonly type: "array";
                readonly items: {
                    readonly type: "string";
                };
            };
            readonly emails: {
                readonly description: "Array of email addresses to remove the tag from";
                readonly type: "array";
                readonly items: {
                    readonly type: "string";
                };
            };
        };
        readonly required: readonly ["tag"];
    };
    readonly response: {
        readonly "200": {
            readonly $schema: "https://json-schema.org/draft/2020-12/schema";
            readonly type: "object";
            readonly properties: {
                readonly removed_count: {
                    readonly description: "Number of members the tag was successfully removed from";
                    readonly type: "number";
                };
                readonly skipped_count: {
                    readonly description: "Number of users skipped because they are not calendar members";
                    readonly type: "number";
                };
            };
            readonly required: readonly ["removed_count", "skipped_count"];
        };
    };
};
declare const PostV1CalendarUpdatePersonTag: {
    readonly body: {
        readonly $schema: "https://json-schema.org/draft/2020-12/schema";
        readonly type: "object";
        readonly properties: {
            readonly tag_api_id: {
                readonly type: "string";
            };
            readonly name: {
                readonly type: "string";
            };
            readonly color: {
                readonly type: "string";
                readonly enum: readonly ["cranberry", "barney", "red", "green", "blue", "purple", "yellow", "orange"];
            };
        };
        readonly required: readonly ["tag_api_id"];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly description: "Empty response";
            readonly properties: {};
            readonly additionalProperties: false;
            readonly "x-stainless-empty-object": true;
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const PostV1EventAddGuests: {
    readonly body: {
        readonly $schema: "https://json-schema.org/draft/2020-12/schema";
        readonly type: "object";
        readonly properties: {
            readonly event_api_id: {
                readonly type: "string";
            };
            readonly guests: {
                readonly type: "array";
                readonly items: {
                    readonly description: "Information about the guests you want to add to the event. If a user already has a name, this will not overwrite their name.";
                    readonly type: "object";
                    readonly properties: {
                        readonly email: {
                            readonly type: "string";
                        };
                        readonly name: {
                            readonly anyOf: readonly [{
                                readonly type: "string";
                            }, {
                                readonly type: "null";
                            }];
                        };
                    };
                    readonly required: readonly ["email"];
                };
            };
            readonly ticket: {
                readonly description: "Optional. Assign a single ticket of the specified type to each guest. Cannot be used with `tickets` parameter.";
                readonly anyOf: readonly [{
                    readonly type: "object";
                    readonly properties: {
                        readonly event_ticket_type_id: {
                            readonly type: "string";
                        };
                    };
                    readonly required: readonly ["event_ticket_type_id"];
                }, {
                    readonly type: "null";
                }];
            };
            readonly tickets: {
                readonly description: "Optional. Assign multiple tickets to each guest. Each guest receives all tickets in the array. Use this to add multiple tickets of the same or different types. Cannot be used with `ticket` parameter.";
                readonly anyOf: readonly [{
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly event_ticket_type_id: {
                                readonly type: "string";
                            };
                        };
                        readonly required: readonly ["event_ticket_type_id"];
                    };
                }, {
                    readonly type: "null";
                }];
            };
        };
        readonly required: readonly ["event_api_id", "guests"];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly description: "Empty response";
            readonly properties: {};
            readonly additionalProperties: false;
            readonly "x-stainless-empty-object": true;
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const PostV1EventAddHost: {
    readonly body: {
        readonly $schema: "https://json-schema.org/draft/2020-12/schema";
        readonly type: "object";
        readonly properties: {
            readonly event_api_id: {
                readonly type: "string";
            };
            readonly email: {
                readonly type: "string";
            };
            readonly access_level: {
                readonly description: "Defaults to manager.";
                readonly anyOf: readonly [{
                    readonly type: "string";
                    readonly enum: readonly ["none", "check-in", "manager"];
                }, {
                    readonly type: "null";
                }];
            };
            readonly is_visible: {
                readonly description: "Defaults to true.";
                readonly type: "boolean";
            };
            readonly name: {
                readonly description: "Name of the host you are adding. If they already have a Luma profile, this will be ignored.";
                readonly type: "string";
            };
        };
        readonly required: readonly ["event_api_id", "email"];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly description: "Empty response";
            readonly properties: {};
            readonly additionalProperties: false;
            readonly "x-stainless-empty-object": true;
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const PostV1EventCreate: {
    readonly body: {
        readonly $schema: "https://json-schema.org/draft/2020-12/schema";
        readonly type: "object";
        readonly properties: {
            readonly can_register_for_multiple_tickets: {
                readonly type: "boolean";
            };
            readonly cover_url: {
                readonly description: "Specify an image that has been uploaded to the Luma CDN. You can upload an image after getting an upload URL from the Luma API.";
                readonly type: "string";
                readonly format: "uri";
                readonly pattern: "^https:\\/\\/images\\.lumacdn\\.com\\/.*";
            };
            readonly coordinate: {
                readonly type: "object";
                readonly properties: {
                    readonly longitude: {
                        readonly type: "number";
                    };
                    readonly latitude: {
                        readonly type: "number";
                    };
                };
                readonly required: readonly ["longitude", "latitude"];
            };
            readonly description_md: {
                readonly description: "Luma stores rich text in a special format called Spark. We don't expose an API for that format, but we can convert Markdown to Spark for you. Some Spark features, like Luma event embeds, are not supported by Markdown.";
                readonly type: "string";
            };
            readonly end_at: {
                readonly description: "ISO 8601 Datetime. For example, 2022-10-19T03:27:13.673Z";
                readonly type: "string";
                readonly format: "date-time";
                readonly pattern: "^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d+)?)?(?:Z|([+-](?:[01]\\d|2[0-3]):[0-5]\\d)))$";
            };
            readonly geo_address_json: {
                readonly anyOf: readonly [{
                    readonly type: "object";
                    readonly properties: {
                        readonly type: {
                            readonly type: "string";
                            readonly const: "manual";
                        };
                        readonly address: {
                            readonly type: "string";
                        };
                    };
                    readonly required: readonly ["type", "address"];
                }, {
                    readonly type: "object";
                    readonly properties: {
                        readonly type: {
                            readonly type: "string";
                            readonly const: "google";
                        };
                        readonly place_id: {
                            readonly type: "string";
                        };
                        readonly description: {
                            readonly anyOf: readonly [{
                                readonly type: "string";
                            }, {
                                readonly type: "null";
                            }];
                        };
                    };
                    readonly required: readonly ["type", "place_id"];
                }];
            };
            readonly max_capacity: {
                readonly description: "Once an event hits the max capacity, the event will be marked as sold out and registration will automatically be closed.\n\nIf `can_register_for_multiple_tickets` is `true`, each ticket will count towards the max capacity.";
                readonly anyOf: readonly [{
                    readonly type: "integer";
                    readonly minimum: -9007199254740991;
                    readonly maximum: 9007199254740991;
                }, {
                    readonly type: "null";
                }];
            };
            readonly meeting_url: {
                readonly type: "string";
            };
            readonly name: {
                readonly type: "string";
            };
            readonly name_requirement: {
                readonly description: "Luma collects the name of every guest as they register. Choose if you'd like to split this into two fields to encourage guests to enter their first and last name.";
                readonly type: "string";
                readonly enum: readonly ["full-name", "first-last"];
            };
            readonly phone_number_requirement: {
                readonly anyOf: readonly [{
                    readonly type: "string";
                    readonly enum: readonly ["optional", "required"];
                }, {
                    readonly type: "null";
                }];
            };
            readonly registration_questions: {
                readonly type: "array";
                readonly items: {
                    readonly anyOf: readonly [{
                        readonly type: "object";
                        readonly properties: {
                            readonly id: {
                                readonly type: "string";
                            };
                            readonly label: {
                                readonly type: "string";
                            };
                            readonly required: {
                                readonly type: "boolean";
                            };
                            readonly question_type: {
                                readonly type: "string";
                                readonly const: "agree-check";
                            };
                        };
                        readonly required: readonly ["id", "label", "required", "question_type"];
                    }, {
                        readonly type: "object";
                        readonly properties: {
                            readonly id: {
                                readonly type: "string";
                            };
                            readonly label: {
                                readonly type: "string";
                            };
                            readonly required: {
                                readonly type: "boolean";
                            };
                            readonly question_type: {
                                readonly type: "string";
                                readonly const: "company";
                            };
                            readonly collect_job_title: {
                                readonly type: "boolean";
                            };
                            readonly job_title_label: {
                                readonly type: "string";
                            };
                        };
                        readonly required: readonly ["id", "label", "required", "question_type"];
                    }, {
                        readonly type: "object";
                        readonly properties: {
                            readonly id: {
                                readonly type: "string";
                            };
                            readonly label: {
                                readonly type: "string";
                            };
                            readonly required: {
                                readonly type: "boolean";
                            };
                            readonly question_type: {
                                readonly type: "string";
                                readonly const: "dropdown";
                            };
                            readonly options: {
                                readonly maxItems: 250;
                                readonly type: "array";
                                readonly items: {
                                    readonly type: "string";
                                };
                            };
                        };
                        readonly required: readonly ["id", "label", "required", "question_type", "options"];
                    }, {
                        readonly type: "object";
                        readonly properties: {
                            readonly id: {
                                readonly type: "string";
                            };
                            readonly label: {
                                readonly type: "string";
                            };
                            readonly required: {
                                readonly type: "boolean";
                            };
                            readonly question_type: {
                                readonly type: "string";
                                readonly const: "github";
                            };
                        };
                        readonly required: readonly ["id", "label", "required", "question_type"];
                    }, {
                        readonly type: "object";
                        readonly properties: {
                            readonly id: {
                                readonly type: "string";
                            };
                            readonly label: {
                                readonly type: "string";
                            };
                            readonly required: {
                                readonly type: "boolean";
                            };
                            readonly question_type: {
                                readonly type: "string";
                                readonly const: "instagram";
                            };
                        };
                        readonly required: readonly ["id", "label", "required", "question_type"];
                    }, {
                        readonly type: "object";
                        readonly properties: {
                            readonly id: {
                                readonly type: "string";
                            };
                            readonly label: {
                                readonly type: "string";
                            };
                            readonly required: {
                                readonly type: "boolean";
                            };
                            readonly question_type: {
                                readonly type: "string";
                                readonly const: "linkedin";
                            };
                        };
                        readonly required: readonly ["id", "label", "required", "question_type"];
                    }, {
                        readonly type: "object";
                        readonly properties: {
                            readonly id: {
                                readonly type: "string";
                            };
                            readonly label: {
                                readonly type: "string";
                            };
                            readonly required: {
                                readonly type: "boolean";
                            };
                            readonly question_type: {
                                readonly type: "string";
                                readonly const: "long-text";
                            };
                        };
                        readonly required: readonly ["id", "label", "required", "question_type"];
                    }, {
                        readonly type: "object";
                        readonly properties: {
                            readonly id: {
                                readonly type: "string";
                            };
                            readonly label: {
                                readonly type: "string";
                            };
                            readonly required: {
                                readonly type: "boolean";
                            };
                            readonly question_type: {
                                readonly type: "string";
                                readonly const: "multi-select";
                            };
                            readonly options: {
                                readonly maxItems: 250;
                                readonly type: "array";
                                readonly items: {
                                    readonly type: "string";
                                };
                            };
                        };
                        readonly required: readonly ["id", "label", "required", "question_type", "options"];
                    }, {
                        readonly type: "object";
                        readonly properties: {
                            readonly id: {
                                readonly type: "string";
                            };
                            readonly label: {
                                readonly type: "string";
                            };
                            readonly required: {
                                readonly type: "boolean";
                            };
                            readonly question_type: {
                                readonly type: "string";
                                readonly const: "phone-number";
                            };
                        };
                        readonly required: readonly ["id", "label", "required", "question_type"];
                    }, {
                        readonly type: "object";
                        readonly properties: {
                            readonly id: {
                                readonly type: "string";
                            };
                            readonly label: {
                                readonly type: "string";
                            };
                            readonly required: {
                                readonly type: "boolean";
                            };
                            readonly question_type: {
                                readonly type: "string";
                                readonly const: "telegram";
                            };
                        };
                        readonly required: readonly ["id", "label", "required", "question_type"];
                    }, {
                        readonly type: "object";
                        readonly properties: {
                            readonly id: {
                                readonly type: "string";
                            };
                            readonly label: {
                                readonly type: "string";
                            };
                            readonly required: {
                                readonly type: "boolean";
                            };
                            readonly question_type: {
                                readonly type: "string";
                                readonly const: "twitter";
                            };
                        };
                        readonly required: readonly ["id", "label", "required", "question_type"];
                    }, {
                        readonly type: "object";
                        readonly properties: {
                            readonly id: {
                                readonly type: "string";
                            };
                            readonly label: {
                                readonly type: "string";
                            };
                            readonly required: {
                                readonly type: "boolean";
                            };
                            readonly question_type: {
                                readonly type: "string";
                                readonly const: "text";
                            };
                        };
                        readonly required: readonly ["id", "label", "required", "question_type"];
                    }, {
                        readonly type: "object";
                        readonly properties: {
                            readonly id: {
                                readonly type: "string";
                            };
                            readonly label: {
                                readonly type: "string";
                            };
                            readonly required: {
                                readonly type: "boolean";
                            };
                            readonly question_type: {
                                readonly type: "string";
                                readonly const: "url";
                            };
                        };
                        readonly required: readonly ["id", "label", "required", "question_type"];
                    }, {
                        readonly type: "object";
                        readonly properties: {
                            readonly id: {
                                readonly type: "string";
                            };
                            readonly label: {
                                readonly type: "string";
                            };
                            readonly required: {
                                readonly type: "boolean";
                            };
                            readonly question_type: {
                                readonly type: "string";
                                readonly const: "youtube";
                            };
                        };
                        readonly required: readonly ["id", "label", "required", "question_type"];
                    }];
                };
            };
            readonly reminders_disabled: {
                readonly description: "By default, Luma will send reminders before the event. Turn off if you'd like more control over event communications.";
                readonly type: "boolean";
            };
            readonly show_guest_list: {
                readonly description: "When the guest list is shown, approved guests will be able to see who else is going to the event.";
                readonly type: "boolean";
            };
            readonly slug: {
                readonly description: "The URL slug for the event. If the slug is `aloha`, the URL will be `https://luma.com/aloha`. If the slug is not available, the event creation will fail.\n\nYou can use `/public/v1/entity/lookup` to check if a slug is available.";
                readonly type: "string";
                readonly minLength: 3;
                readonly maxLength: 50;
            };
            readonly start_at: {
                readonly description: "ISO 8601 Datetime. For example, 2022-10-19T03:27:13.673Z";
                readonly type: "string";
                readonly format: "date-time";
                readonly pattern: "^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d+)?)?(?:Z|([+-](?:[01]\\d|2[0-3]):[0-5]\\d)))$";
            };
            readonly timezone: {
                readonly description: "IANA Timezone, e.g. America/New_York. https://en.wikipedia.org/wiki/List_of_tz_database_time_zones";
                readonly type: "string";
            };
            readonly tint_color: {
                readonly description: "A hex color like '#bb2dc7'. Alpha channels (#rgba, #rrggbbaa) are automatically stripped.";
                readonly type: "string";
            };
            readonly visibility: {
                readonly type: "string";
                readonly enum: readonly ["public", "members-only", "private"];
            };
        };
        readonly required: readonly ["name", "start_at", "timezone"];
    };
    readonly response: {
        readonly "200": {
            readonly $schema: "https://json-schema.org/draft/2020-12/schema";
            readonly type: "object";
            readonly properties: {
                readonly api_id: {
                    readonly type: "string";
                };
            };
            readonly required: readonly ["api_id"];
        };
    };
};
declare const PostV1EventCreateCoupon: {
    readonly body: {
        readonly $schema: "https://json-schema.org/draft/2020-12/schema";
        readonly type: "object";
        readonly properties: {
            readonly code: {
                readonly description: "This is the code that the user will enter on the event page. It is not case sensitive. Maximum 20 characters.";
                readonly type: "string";
                readonly minLength: 1;
                readonly maxLength: 20;
            };
            readonly remaining_count: {
                readonly description: "Number of times the coupon can be used. Set to 1000000 for unlimited uses.";
                readonly type: "integer";
                readonly minimum: 0;
                readonly maximum: 1000000;
            };
            readonly valid_start_at: {
                readonly anyOf: readonly [{
                    readonly description: "ISO 8601 Datetime. For example, 2022-10-19T03:27:13.673Z";
                    readonly type: "string";
                    readonly format: "date-time";
                    readonly pattern: "^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d+)?)?(?:Z|([+-](?:[01]\\d|2[0-3]):[0-5]\\d)))$";
                }, {
                    readonly type: "null";
                }];
            };
            readonly valid_end_at: {
                readonly anyOf: readonly [{
                    readonly description: "ISO 8601 Datetime. For example, 2022-10-19T03:27:13.673Z";
                    readonly type: "string";
                    readonly format: "date-time";
                    readonly pattern: "^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d+)?)?(?:Z|([+-](?:[01]\\d|2[0-3]):[0-5]\\d)))$";
                }, {
                    readonly type: "null";
                }];
            };
            readonly discount: {
                readonly anyOf: readonly [{
                    readonly type: "object";
                    readonly properties: {
                        readonly discount_type: {
                            readonly type: "string";
                            readonly const: "percent";
                        };
                        readonly percent_off: {
                            readonly type: "number";
                            readonly minimum: 0;
                            readonly maximum: 100;
                        };
                    };
                    readonly required: readonly ["discount_type", "percent_off"];
                }, {
                    readonly type: "object";
                    readonly properties: {
                        readonly discount_type: {
                            readonly type: "string";
                            readonly const: "amount";
                        };
                        readonly cents_off: {
                            readonly type: "number";
                            readonly minimum: 0;
                        };
                        readonly currency: {
                            readonly type: "string";
                            readonly enum: readonly ["solana_sol", "solana_usdc", "aed", "afn", "all", "amd", "ang", "aoa", "ars", "aud", "awg", "azn", "bam", "bbd", "bdt", "bgn", "bhd", "bif", "bmd", "bnd", "bob", "brl", "bsd", "bwp", "byn", "bzd", "cad", "cdf", "chf", "clp", "cny", "cop", "crc", "cve", "czk", "djf", "dkk", "dop", "dzd", "egp", "etb", "eur", "fjd", "fkp", "gbp", "gel", "ghs", "gip", "gmd", "gnf", "gtq", "gyd", "hkd", "hnl", "htg", "huf", "idr", "ils", "inr", "isk", "jmd", "jod", "jpy", "kes", "kgs", "khr", "kmf", "krw", "kwd", "kyd", "kzt", "lak", "lbp", "lkr", "lrd", "lsl", "mad", "mdl", "mga", "mkd", "mmk", "mnt", "mop", "mur", "mvr", "mwk", "mxn", "myr", "mzn", "nad", "ngn", "nio", "nok", "npr", "nzd", "omr", "pab", "pen", "pgk", "php", "pkr", "pln", "pyg", "qar", "ron", "rsd", "rub", "rwf", "sar", "sbd", "scr", "sek", "sgd", "shp", "sle", "sos", "srd", "std", "szl", "thb", "tjs", "tnd", "top", "try", "ttd", "twd", "tzs", "uah", "ugx", "usd", "uyu", "uzs", "vnd", "vuv", "wst", "xaf", "xcd", "xof", "xpf", "yer", "zar", "zmw"];
                        };
                    };
                    readonly required: readonly ["discount_type", "cents_off", "currency"];
                }];
            };
            readonly event_api_id: {
                readonly type: "string";
            };
        };
        readonly required: readonly ["code", "discount", "event_api_id"];
    };
    readonly response: {
        readonly "200": {
            readonly $schema: "https://json-schema.org/draft/2020-12/schema";
            readonly type: "object";
            readonly properties: {
                readonly coupon: {
                    readonly type: "object";
                    readonly properties: {
                        readonly api_id: {
                            readonly type: "string";
                        };
                    };
                    readonly required: readonly ["api_id"];
                };
            };
            readonly required: readonly ["coupon"];
        };
    };
};
declare const PostV1EventSendInvites: {
    readonly body: {
        readonly $schema: "https://json-schema.org/draft/2020-12/schema";
        readonly type: "object";
        readonly properties: {
            readonly event_api_id: {
                readonly type: "string";
            };
            readonly guests: {
                readonly description: "Information about the guests you want to add to the event. If a user already has a name, this will not overwrite their name.";
                readonly type: "array";
                readonly items: {
                    readonly type: "object";
                    readonly properties: {
                        readonly email: {
                            readonly type: "string";
                        };
                        readonly name: {
                            readonly anyOf: readonly [{
                                readonly type: "string";
                            }, {
                                readonly type: "null";
                            }];
                        };
                    };
                    readonly required: readonly ["email"];
                };
            };
            readonly message: {
                readonly description: "Personalize the message that will be included in the invite. Max of 200 characters.";
                readonly anyOf: readonly [{
                    readonly type: "string";
                    readonly maxLength: 200;
                }, {
                    readonly type: "null";
                }];
            };
        };
        readonly required: readonly ["event_api_id", "guests"];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly description: "Empty response";
            readonly properties: {};
            readonly additionalProperties: false;
            readonly "x-stainless-empty-object": true;
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const PostV1EventTicketTypesCreate: {
    readonly body: {
        readonly $schema: "https://json-schema.org/draft/2020-12/schema";
        readonly type: "object";
        readonly required: readonly ["event_api_id", "name", "type"];
        readonly properties: {
            readonly event_api_id: {
                readonly description: "Event API ID (e.g., 'evt-123')";
                readonly type: "string";
            };
            readonly name: {
                readonly type: "string";
            };
            readonly require_approval: {
                readonly type: "boolean";
            };
            readonly is_hidden: {
                readonly type: "boolean";
            };
            readonly description: {
                readonly anyOf: readonly [{
                    readonly type: "string";
                }, {
                    readonly type: "null";
                }];
            };
            readonly valid_start_at: {
                readonly anyOf: readonly [{
                    readonly description: "ISO 8601 Date. For example, 2025-09-01";
                    readonly type: "string";
                }, {
                    readonly type: "null";
                }];
            };
            readonly valid_end_at: {
                readonly anyOf: readonly [{
                    readonly description: "ISO 8601 Date. For example, 2025-09-01";
                    readonly type: "string";
                }, {
                    readonly type: "null";
                }];
            };
            readonly max_capacity: {
                readonly anyOf: readonly [{
                    readonly type: "number";
                }, {
                    readonly type: "null";
                }];
            };
            readonly type: {
                readonly type: "string";
                readonly enum: readonly ["free", "paid"];
            };
            readonly cents: {
                readonly anyOf: readonly [{
                    readonly type: "number";
                }, {
                    readonly type: "null";
                }];
            };
            readonly currency: {
                readonly anyOf: readonly [{
                    readonly type: "string";
                }, {
                    readonly type: "null";
                }];
            };
            readonly is_flexible: {
                readonly type: "boolean";
            };
            readonly min_cents: {
                readonly anyOf: readonly [{
                    readonly type: "number";
                }, {
                    readonly type: "null";
                }];
            };
        };
    };
    readonly response: {
        readonly "200": {
            readonly $schema: "https://json-schema.org/draft/2020-12/schema";
            readonly type: "object";
            readonly properties: {
                readonly ticket_type: {
                    readonly anyOf: readonly [{
                        readonly type: "object";
                        readonly required: readonly ["name", "require_approval", "ethereum_token_requirements", "type", "cents", "currency", "is_flexible", "min_cents"];
                        readonly properties: {
                            readonly name: {
                                readonly type: "string";
                            };
                            readonly require_approval: {
                                readonly type: "boolean";
                            };
                            readonly is_hidden: {
                                readonly default: false;
                                readonly type: "boolean";
                            };
                            readonly description: {
                                readonly anyOf: readonly [{
                                    readonly type: "string";
                                }, {
                                    readonly type: "null";
                                }];
                            };
                            readonly valid_start_at: {
                                readonly anyOf: readonly [{
                                    readonly type: "string";
                                }, {
                                    readonly type: "null";
                                }];
                            };
                            readonly valid_end_at: {
                                readonly anyOf: readonly [{
                                    readonly type: "string";
                                }, {
                                    readonly type: "null";
                                }];
                            };
                            readonly max_capacity: {
                                readonly anyOf: readonly [{
                                    readonly type: "number";
                                }, {
                                    readonly type: "null";
                                }];
                            };
                            readonly membership_restriction: {
                                readonly anyOf: readonly [{
                                    readonly anyOf: readonly [{
                                        readonly type: "object";
                                        readonly properties: {
                                            readonly type: {
                                                readonly type: "string";
                                                readonly const: "all-members";
                                            };
                                        };
                                        readonly required: readonly ["type"];
                                    }, {
                                        readonly type: "object";
                                        readonly properties: {
                                            readonly type: {
                                                readonly type: "string";
                                                readonly const: "memberships";
                                            };
                                            readonly calendar_membership_tier_api_ids: {
                                                readonly type: "array";
                                                readonly items: {
                                                    readonly type: "string";
                                                };
                                            };
                                        };
                                        readonly required: readonly ["type", "calendar_membership_tier_api_ids"];
                                    }];
                                }, {
                                    readonly type: "null";
                                }];
                            };
                            readonly ethereum_token_requirements: {
                                readonly type: "array";
                                readonly items: {
                                    readonly anyOf: readonly [{
                                        readonly type: "object";
                                        readonly properties: {
                                            readonly chain: {
                                                readonly type: "string";
                                                readonly const: "ethereum";
                                            };
                                            readonly type: {
                                                readonly type: "string";
                                                readonly const: "erc-721";
                                            };
                                            readonly contract: {
                                                readonly type: "object";
                                                readonly required: readonly ["type", "contract_name", "contract_address"];
                                                readonly properties: {
                                                    readonly type: {
                                                        readonly type: "string";
                                                        readonly const: "erc-721";
                                                    };
                                                    readonly contract_name: {
                                                        readonly type: "string";
                                                    };
                                                    readonly contract_address: {
                                                        readonly type: "string";
                                                        readonly pattern: "^0x[0-9a-fA-F]{40}$";
                                                    };
                                                };
                                            };
                                            readonly min_token_id: {
                                                readonly anyOf: readonly [{
                                                    readonly type: "string";
                                                    readonly pattern: "^\\d+$";
                                                }, {
                                                    readonly type: "null";
                                                }];
                                            };
                                            readonly max_token_id: {
                                                readonly anyOf: readonly [{
                                                    readonly type: "string";
                                                    readonly pattern: "^\\d+$";
                                                }, {
                                                    readonly type: "null";
                                                }];
                                            };
                                        };
                                        readonly required: readonly ["chain", "type", "contract"];
                                    }, {
                                        readonly type: "object";
                                        readonly properties: {
                                            readonly chain: {
                                                readonly type: "string";
                                                readonly const: "ethereum";
                                            };
                                            readonly type: {
                                                readonly type: "string";
                                                readonly const: "erc-20";
                                            };
                                            readonly contract: {
                                                readonly type: "object";
                                                readonly required: readonly ["type", "contract_name", "contract_address", "decimals", "symbol"];
                                                readonly properties: {
                                                    readonly type: {
                                                        readonly type: "string";
                                                        readonly const: "erc-20";
                                                    };
                                                    readonly contract_name: {
                                                        readonly anyOf: readonly [{
                                                            readonly type: "string";
                                                        }, {
                                                            readonly type: "null";
                                                        }];
                                                    };
                                                    readonly contract_address: {
                                                        readonly type: "string";
                                                        readonly pattern: "^0x[0-9a-fA-F]{40}$";
                                                    };
                                                    readonly decimals: {
                                                        readonly type: "number";
                                                    };
                                                    readonly symbol: {
                                                        readonly anyOf: readonly [{
                                                            readonly type: "string";
                                                        }, {
                                                            readonly type: "null";
                                                        }];
                                                    };
                                                    readonly image: {
                                                        readonly anyOf: readonly [{
                                                            readonly type: "string";
                                                        }, {
                                                            readonly type: "null";
                                                        }];
                                                    };
                                                };
                                            };
                                            readonly min_token_balance: {
                                                readonly anyOf: readonly [{
                                                    readonly type: "string";
                                                    readonly pattern: "^\\d+$";
                                                }, {
                                                    readonly type: "null";
                                                }];
                                            };
                                        };
                                        readonly required: readonly ["chain", "type", "contract"];
                                    }];
                                };
                            };
                            readonly type: {
                                readonly type: "string";
                                readonly const: "free";
                            };
                            readonly cents: {
                                readonly type: "null";
                            };
                            readonly currency: {
                                readonly type: "null";
                            };
                            readonly is_flexible: {
                                readonly type: "boolean";
                                readonly const: false;
                            };
                            readonly min_cents: {
                                readonly type: "null";
                            };
                            readonly api_id: {
                                readonly type: "string";
                            };
                        };
                    }, {
                        readonly type: "object";
                        readonly required: readonly ["name", "require_approval", "ethereum_token_requirements", "type", "cents", "currency", "is_flexible", "min_cents"];
                        readonly properties: {
                            readonly name: {
                                readonly type: "string";
                            };
                            readonly require_approval: {
                                readonly type: "boolean";
                            };
                            readonly is_hidden: {
                                readonly default: false;
                                readonly type: "boolean";
                            };
                            readonly description: {
                                readonly anyOf: readonly [{
                                    readonly type: "string";
                                }, {
                                    readonly type: "null";
                                }];
                            };
                            readonly valid_start_at: {
                                readonly anyOf: readonly [{
                                    readonly type: "string";
                                }, {
                                    readonly type: "null";
                                }];
                            };
                            readonly valid_end_at: {
                                readonly anyOf: readonly [{
                                    readonly type: "string";
                                }, {
                                    readonly type: "null";
                                }];
                            };
                            readonly max_capacity: {
                                readonly anyOf: readonly [{
                                    readonly type: "number";
                                }, {
                                    readonly type: "null";
                                }];
                            };
                            readonly membership_restriction: {
                                readonly anyOf: readonly [{
                                    readonly anyOf: readonly [{
                                        readonly type: "object";
                                        readonly properties: {
                                            readonly type: {
                                                readonly type: "string";
                                                readonly const: "all-members";
                                            };
                                        };
                                        readonly required: readonly ["type"];
                                    }, {
                                        readonly type: "object";
                                        readonly properties: {
                                            readonly type: {
                                                readonly type: "string";
                                                readonly const: "memberships";
                                            };
                                            readonly calendar_membership_tier_api_ids: {
                                                readonly type: "array";
                                                readonly items: {
                                                    readonly type: "string";
                                                };
                                            };
                                        };
                                        readonly required: readonly ["type", "calendar_membership_tier_api_ids"];
                                    }];
                                }, {
                                    readonly type: "null";
                                }];
                            };
                            readonly ethereum_token_requirements: {
                                readonly type: "array";
                                readonly items: {
                                    readonly anyOf: readonly [{
                                        readonly type: "object";
                                        readonly properties: {
                                            readonly chain: {
                                                readonly type: "string";
                                                readonly const: "ethereum";
                                            };
                                            readonly type: {
                                                readonly type: "string";
                                                readonly const: "erc-721";
                                            };
                                            readonly contract: {
                                                readonly type: "object";
                                                readonly required: readonly ["type", "contract_name", "contract_address"];
                                                readonly properties: {
                                                    readonly type: {
                                                        readonly type: "string";
                                                        readonly const: "erc-721";
                                                    };
                                                    readonly contract_name: {
                                                        readonly type: "string";
                                                    };
                                                    readonly contract_address: {
                                                        readonly type: "string";
                                                        readonly pattern: "^0x[0-9a-fA-F]{40}$";
                                                    };
                                                };
                                            };
                                            readonly min_token_id: {
                                                readonly anyOf: readonly [{
                                                    readonly type: "string";
                                                    readonly pattern: "^\\d+$";
                                                }, {
                                                    readonly type: "null";
                                                }];
                                            };
                                            readonly max_token_id: {
                                                readonly anyOf: readonly [{
                                                    readonly type: "string";
                                                    readonly pattern: "^\\d+$";
                                                }, {
                                                    readonly type: "null";
                                                }];
                                            };
                                        };
                                        readonly required: readonly ["chain", "type", "contract"];
                                    }, {
                                        readonly type: "object";
                                        readonly properties: {
                                            readonly chain: {
                                                readonly type: "string";
                                                readonly const: "ethereum";
                                            };
                                            readonly type: {
                                                readonly type: "string";
                                                readonly const: "erc-20";
                                            };
                                            readonly contract: {
                                                readonly type: "object";
                                                readonly required: readonly ["type", "contract_name", "contract_address", "decimals", "symbol"];
                                                readonly properties: {
                                                    readonly type: {
                                                        readonly type: "string";
                                                        readonly const: "erc-20";
                                                    };
                                                    readonly contract_name: {
                                                        readonly anyOf: readonly [{
                                                            readonly type: "string";
                                                        }, {
                                                            readonly type: "null";
                                                        }];
                                                    };
                                                    readonly contract_address: {
                                                        readonly type: "string";
                                                        readonly pattern: "^0x[0-9a-fA-F]{40}$";
                                                    };
                                                    readonly decimals: {
                                                        readonly type: "number";
                                                    };
                                                    readonly symbol: {
                                                        readonly anyOf: readonly [{
                                                            readonly type: "string";
                                                        }, {
                                                            readonly type: "null";
                                                        }];
                                                    };
                                                    readonly image: {
                                                        readonly anyOf: readonly [{
                                                            readonly type: "string";
                                                        }, {
                                                            readonly type: "null";
                                                        }];
                                                    };
                                                };
                                            };
                                            readonly min_token_balance: {
                                                readonly anyOf: readonly [{
                                                    readonly type: "string";
                                                    readonly pattern: "^\\d+$";
                                                }, {
                                                    readonly type: "null";
                                                }];
                                            };
                                        };
                                        readonly required: readonly ["chain", "type", "contract"];
                                    }];
                                };
                            };
                            readonly type: {
                                readonly type: "string";
                                readonly const: "fiat-price";
                            };
                            readonly cents: {
                                readonly type: "integer";
                                readonly minimum: 0;
                                readonly maximum: 9007199254740991;
                            };
                            readonly currency: {
                                readonly type: "string";
                                readonly enum: readonly ["solana_sol", "solana_usdc", "aed", "afn", "all", "amd", "ang", "aoa", "ars", "aud", "awg", "azn", "bam", "bbd", "bdt", "bgn", "bhd", "bif", "bmd", "bnd", "bob", "brl", "bsd", "bwp", "byn", "bzd", "cad", "cdf", "chf", "clp", "cny", "cop", "crc", "cve", "czk", "djf", "dkk", "dop", "dzd", "egp", "etb", "eur", "fjd", "fkp", "gbp", "gel", "ghs", "gip", "gmd", "gnf", "gtq", "gyd", "hkd", "hnl", "htg", "huf", "idr", "ils", "inr", "isk", "jmd", "jod", "jpy", "kes", "kgs", "khr", "kmf", "krw", "kwd", "kyd", "kzt", "lak", "lbp", "lkr", "lrd", "lsl", "mad", "mdl", "mga", "mkd", "mmk", "mnt", "mop", "mur", "mvr", "mwk", "mxn", "myr", "mzn", "nad", "ngn", "nio", "nok", "npr", "nzd", "omr", "pab", "pen", "pgk", "php", "pkr", "pln", "pyg", "qar", "ron", "rsd", "rub", "rwf", "sar", "sbd", "scr", "sek", "sgd", "shp", "sle", "sos", "srd", "std", "szl", "thb", "tjs", "tnd", "top", "try", "ttd", "twd", "tzs", "uah", "ugx", "usd", "uyu", "uzs", "vnd", "vuv", "wst", "xaf", "xcd", "xof", "xpf", "yer", "zar", "zmw"];
                                readonly description: "`solana_sol` `solana_usdc` `aed` `afn` `all` `amd` `ang` `aoa` `ars` `aud` `awg` `azn` `bam` `bbd` `bdt` `bgn` `bhd` `bif` `bmd` `bnd` `bob` `brl` `bsd` `bwp` `byn` `bzd` `cad` `cdf` `chf` `clp` `cny` `cop` `crc` `cve` `czk` `djf` `dkk` `dop` `dzd` `egp` `etb` `eur` `fjd` `fkp` `gbp` `gel` `ghs` `gip` `gmd` `gnf` `gtq` `gyd` `hkd` `hnl` `htg` `huf` `idr` `ils` `inr` `isk` `jmd` `jod` `jpy` `kes` `kgs` `khr` `kmf` `krw` `kwd` `kyd` `kzt` `lak` `lbp` `lkr` `lrd` `lsl` `mad` `mdl` `mga` `mkd` `mmk` `mnt` `mop` `mur` `mvr` `mwk` `mxn` `myr` `mzn` `nad` `ngn` `nio` `nok` `npr` `nzd` `omr` `pab` `pen` `pgk` `php` `pkr` `pln` `pyg` `qar` `ron` `rsd` `rub` `rwf` `sar` `sbd` `scr` `sek` `sgd` `shp` `sle` `sos` `srd` `std` `szl` `thb` `tjs` `tnd` `top` `try` `ttd` `twd` `tzs` `uah` `ugx` `usd` `uyu` `uzs` `vnd` `vuv` `wst` `xaf` `xcd` `xof` `xpf` `yer` `zar` `zmw`";
                            };
                            readonly is_flexible: {
                                readonly type: "boolean";
                            };
                            readonly min_cents: {
                                readonly anyOf: readonly [{
                                    readonly type: "integer";
                                    readonly minimum: 0;
                                    readonly maximum: 9007199254740991;
                                }, {
                                    readonly type: "null";
                                }];
                            };
                            readonly api_id: {
                                readonly type: "string";
                            };
                        };
                    }];
                    readonly type: "object";
                    readonly required: readonly ["api_id"];
                };
            };
            readonly required: readonly ["ticket_type"];
        };
    };
};
declare const PostV1EventTicketTypesDelete: {
    readonly body: {
        readonly $schema: "https://json-schema.org/draft/2020-12/schema";
        readonly type: "object";
        readonly properties: {
            readonly event_ticket_type_api_id: {
                readonly description: "Event ticket type API ID to delete";
                readonly type: "string";
            };
        };
        readonly required: readonly ["event_ticket_type_api_id"];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly description: "Empty response";
            readonly properties: {};
            readonly additionalProperties: false;
            readonly "x-stainless-empty-object": true;
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const PostV1EventTicketTypesUpdate: {
    readonly body: {
        readonly $schema: "https://json-schema.org/draft/2020-12/schema";
        readonly type: "object";
        readonly required: readonly ["event_ticket_type_api_id"];
        readonly properties: {
            readonly event_ticket_type_api_id: {
                readonly description: "Event ticket type API ID (e.g., 'ett-123')";
                readonly type: "string";
            };
            readonly name: {
                readonly type: "string";
            };
            readonly require_approval: {
                readonly type: "boolean";
            };
            readonly is_hidden: {
                readonly type: "boolean";
            };
            readonly description: {
                readonly anyOf: readonly [{
                    readonly type: "string";
                }, {
                    readonly type: "null";
                }];
            };
            readonly valid_start_at: {
                readonly anyOf: readonly [{
                    readonly description: "ISO 8601 Date. For example, 2025-09-01";
                    readonly type: "string";
                }, {
                    readonly type: "null";
                }];
            };
            readonly valid_end_at: {
                readonly anyOf: readonly [{
                    readonly description: "ISO 8601 Date. For example, 2025-09-01";
                    readonly type: "string";
                }, {
                    readonly type: "null";
                }];
            };
            readonly max_capacity: {
                readonly anyOf: readonly [{
                    readonly type: "number";
                }, {
                    readonly type: "null";
                }];
            };
            readonly type: {
                readonly type: "string";
                readonly enum: readonly ["free", "paid"];
            };
            readonly cents: {
                readonly anyOf: readonly [{
                    readonly type: "number";
                }, {
                    readonly type: "null";
                }];
            };
            readonly currency: {
                readonly anyOf: readonly [{
                    readonly type: "string";
                }, {
                    readonly type: "null";
                }];
            };
            readonly is_flexible: {
                readonly type: "boolean";
            };
            readonly min_cents: {
                readonly anyOf: readonly [{
                    readonly type: "number";
                }, {
                    readonly type: "null";
                }];
            };
        };
    };
    readonly response: {
        readonly "200": {
            readonly $schema: "https://json-schema.org/draft/2020-12/schema";
            readonly type: "object";
            readonly properties: {
                readonly ticket_type: {
                    readonly anyOf: readonly [{
                        readonly type: "object";
                        readonly required: readonly ["name", "require_approval", "ethereum_token_requirements", "type", "cents", "currency", "is_flexible", "min_cents"];
                        readonly properties: {
                            readonly name: {
                                readonly type: "string";
                            };
                            readonly require_approval: {
                                readonly type: "boolean";
                            };
                            readonly is_hidden: {
                                readonly default: false;
                                readonly type: "boolean";
                            };
                            readonly description: {
                                readonly anyOf: readonly [{
                                    readonly type: "string";
                                }, {
                                    readonly type: "null";
                                }];
                            };
                            readonly valid_start_at: {
                                readonly anyOf: readonly [{
                                    readonly type: "string";
                                }, {
                                    readonly type: "null";
                                }];
                            };
                            readonly valid_end_at: {
                                readonly anyOf: readonly [{
                                    readonly type: "string";
                                }, {
                                    readonly type: "null";
                                }];
                            };
                            readonly max_capacity: {
                                readonly anyOf: readonly [{
                                    readonly type: "number";
                                }, {
                                    readonly type: "null";
                                }];
                            };
                            readonly membership_restriction: {
                                readonly anyOf: readonly [{
                                    readonly anyOf: readonly [{
                                        readonly type: "object";
                                        readonly properties: {
                                            readonly type: {
                                                readonly type: "string";
                                                readonly const: "all-members";
                                            };
                                        };
                                        readonly required: readonly ["type"];
                                    }, {
                                        readonly type: "object";
                                        readonly properties: {
                                            readonly type: {
                                                readonly type: "string";
                                                readonly const: "memberships";
                                            };
                                            readonly calendar_membership_tier_api_ids: {
                                                readonly type: "array";
                                                readonly items: {
                                                    readonly type: "string";
                                                };
                                            };
                                        };
                                        readonly required: readonly ["type", "calendar_membership_tier_api_ids"];
                                    }];
                                }, {
                                    readonly type: "null";
                                }];
                            };
                            readonly ethereum_token_requirements: {
                                readonly type: "array";
                                readonly items: {
                                    readonly anyOf: readonly [{
                                        readonly type: "object";
                                        readonly properties: {
                                            readonly chain: {
                                                readonly type: "string";
                                                readonly const: "ethereum";
                                            };
                                            readonly type: {
                                                readonly type: "string";
                                                readonly const: "erc-721";
                                            };
                                            readonly contract: {
                                                readonly type: "object";
                                                readonly required: readonly ["type", "contract_name", "contract_address"];
                                                readonly properties: {
                                                    readonly type: {
                                                        readonly type: "string";
                                                        readonly const: "erc-721";
                                                    };
                                                    readonly contract_name: {
                                                        readonly type: "string";
                                                    };
                                                    readonly contract_address: {
                                                        readonly type: "string";
                                                        readonly pattern: "^0x[0-9a-fA-F]{40}$";
                                                    };
                                                };
                                            };
                                            readonly min_token_id: {
                                                readonly anyOf: readonly [{
                                                    readonly type: "string";
                                                    readonly pattern: "^\\d+$";
                                                }, {
                                                    readonly type: "null";
                                                }];
                                            };
                                            readonly max_token_id: {
                                                readonly anyOf: readonly [{
                                                    readonly type: "string";
                                                    readonly pattern: "^\\d+$";
                                                }, {
                                                    readonly type: "null";
                                                }];
                                            };
                                        };
                                        readonly required: readonly ["chain", "type", "contract"];
                                    }, {
                                        readonly type: "object";
                                        readonly properties: {
                                            readonly chain: {
                                                readonly type: "string";
                                                readonly const: "ethereum";
                                            };
                                            readonly type: {
                                                readonly type: "string";
                                                readonly const: "erc-20";
                                            };
                                            readonly contract: {
                                                readonly type: "object";
                                                readonly required: readonly ["type", "contract_name", "contract_address", "decimals", "symbol"];
                                                readonly properties: {
                                                    readonly type: {
                                                        readonly type: "string";
                                                        readonly const: "erc-20";
                                                    };
                                                    readonly contract_name: {
                                                        readonly anyOf: readonly [{
                                                            readonly type: "string";
                                                        }, {
                                                            readonly type: "null";
                                                        }];
                                                    };
                                                    readonly contract_address: {
                                                        readonly type: "string";
                                                        readonly pattern: "^0x[0-9a-fA-F]{40}$";
                                                    };
                                                    readonly decimals: {
                                                        readonly type: "number";
                                                    };
                                                    readonly symbol: {
                                                        readonly anyOf: readonly [{
                                                            readonly type: "string";
                                                        }, {
                                                            readonly type: "null";
                                                        }];
                                                    };
                                                    readonly image: {
                                                        readonly anyOf: readonly [{
                                                            readonly type: "string";
                                                        }, {
                                                            readonly type: "null";
                                                        }];
                                                    };
                                                };
                                            };
                                            readonly min_token_balance: {
                                                readonly anyOf: readonly [{
                                                    readonly type: "string";
                                                    readonly pattern: "^\\d+$";
                                                }, {
                                                    readonly type: "null";
                                                }];
                                            };
                                        };
                                        readonly required: readonly ["chain", "type", "contract"];
                                    }];
                                };
                            };
                            readonly type: {
                                readonly type: "string";
                                readonly const: "free";
                            };
                            readonly cents: {
                                readonly type: "null";
                            };
                            readonly currency: {
                                readonly type: "null";
                            };
                            readonly is_flexible: {
                                readonly type: "boolean";
                                readonly const: false;
                            };
                            readonly min_cents: {
                                readonly type: "null";
                            };
                            readonly api_id: {
                                readonly type: "string";
                            };
                        };
                    }, {
                        readonly type: "object";
                        readonly required: readonly ["name", "require_approval", "ethereum_token_requirements", "type", "cents", "currency", "is_flexible", "min_cents"];
                        readonly properties: {
                            readonly name: {
                                readonly type: "string";
                            };
                            readonly require_approval: {
                                readonly type: "boolean";
                            };
                            readonly is_hidden: {
                                readonly default: false;
                                readonly type: "boolean";
                            };
                            readonly description: {
                                readonly anyOf: readonly [{
                                    readonly type: "string";
                                }, {
                                    readonly type: "null";
                                }];
                            };
                            readonly valid_start_at: {
                                readonly anyOf: readonly [{
                                    readonly type: "string";
                                }, {
                                    readonly type: "null";
                                }];
                            };
                            readonly valid_end_at: {
                                readonly anyOf: readonly [{
                                    readonly type: "string";
                                }, {
                                    readonly type: "null";
                                }];
                            };
                            readonly max_capacity: {
                                readonly anyOf: readonly [{
                                    readonly type: "number";
                                }, {
                                    readonly type: "null";
                                }];
                            };
                            readonly membership_restriction: {
                                readonly anyOf: readonly [{
                                    readonly anyOf: readonly [{
                                        readonly type: "object";
                                        readonly properties: {
                                            readonly type: {
                                                readonly type: "string";
                                                readonly const: "all-members";
                                            };
                                        };
                                        readonly required: readonly ["type"];
                                    }, {
                                        readonly type: "object";
                                        readonly properties: {
                                            readonly type: {
                                                readonly type: "string";
                                                readonly const: "memberships";
                                            };
                                            readonly calendar_membership_tier_api_ids: {
                                                readonly type: "array";
                                                readonly items: {
                                                    readonly type: "string";
                                                };
                                            };
                                        };
                                        readonly required: readonly ["type", "calendar_membership_tier_api_ids"];
                                    }];
                                }, {
                                    readonly type: "null";
                                }];
                            };
                            readonly ethereum_token_requirements: {
                                readonly type: "array";
                                readonly items: {
                                    readonly anyOf: readonly [{
                                        readonly type: "object";
                                        readonly properties: {
                                            readonly chain: {
                                                readonly type: "string";
                                                readonly const: "ethereum";
                                            };
                                            readonly type: {
                                                readonly type: "string";
                                                readonly const: "erc-721";
                                            };
                                            readonly contract: {
                                                readonly type: "object";
                                                readonly required: readonly ["type", "contract_name", "contract_address"];
                                                readonly properties: {
                                                    readonly type: {
                                                        readonly type: "string";
                                                        readonly const: "erc-721";
                                                    };
                                                    readonly contract_name: {
                                                        readonly type: "string";
                                                    };
                                                    readonly contract_address: {
                                                        readonly type: "string";
                                                        readonly pattern: "^0x[0-9a-fA-F]{40}$";
                                                    };
                                                };
                                            };
                                            readonly min_token_id: {
                                                readonly anyOf: readonly [{
                                                    readonly type: "string";
                                                    readonly pattern: "^\\d+$";
                                                }, {
                                                    readonly type: "null";
                                                }];
                                            };
                                            readonly max_token_id: {
                                                readonly anyOf: readonly [{
                                                    readonly type: "string";
                                                    readonly pattern: "^\\d+$";
                                                }, {
                                                    readonly type: "null";
                                                }];
                                            };
                                        };
                                        readonly required: readonly ["chain", "type", "contract"];
                                    }, {
                                        readonly type: "object";
                                        readonly properties: {
                                            readonly chain: {
                                                readonly type: "string";
                                                readonly const: "ethereum";
                                            };
                                            readonly type: {
                                                readonly type: "string";
                                                readonly const: "erc-20";
                                            };
                                            readonly contract: {
                                                readonly type: "object";
                                                readonly required: readonly ["type", "contract_name", "contract_address", "decimals", "symbol"];
                                                readonly properties: {
                                                    readonly type: {
                                                        readonly type: "string";
                                                        readonly const: "erc-20";
                                                    };
                                                    readonly contract_name: {
                                                        readonly anyOf: readonly [{
                                                            readonly type: "string";
                                                        }, {
                                                            readonly type: "null";
                                                        }];
                                                    };
                                                    readonly contract_address: {
                                                        readonly type: "string";
                                                        readonly pattern: "^0x[0-9a-fA-F]{40}$";
                                                    };
                                                    readonly decimals: {
                                                        readonly type: "number";
                                                    };
                                                    readonly symbol: {
                                                        readonly anyOf: readonly [{
                                                            readonly type: "string";
                                                        }, {
                                                            readonly type: "null";
                                                        }];
                                                    };
                                                    readonly image: {
                                                        readonly anyOf: readonly [{
                                                            readonly type: "string";
                                                        }, {
                                                            readonly type: "null";
                                                        }];
                                                    };
                                                };
                                            };
                                            readonly min_token_balance: {
                                                readonly anyOf: readonly [{
                                                    readonly type: "string";
                                                    readonly pattern: "^\\d+$";
                                                }, {
                                                    readonly type: "null";
                                                }];
                                            };
                                        };
                                        readonly required: readonly ["chain", "type", "contract"];
                                    }];
                                };
                            };
                            readonly type: {
                                readonly type: "string";
                                readonly const: "fiat-price";
                            };
                            readonly cents: {
                                readonly type: "integer";
                                readonly minimum: 0;
                                readonly maximum: 9007199254740991;
                            };
                            readonly currency: {
                                readonly type: "string";
                                readonly enum: readonly ["solana_sol", "solana_usdc", "aed", "afn", "all", "amd", "ang", "aoa", "ars", "aud", "awg", "azn", "bam", "bbd", "bdt", "bgn", "bhd", "bif", "bmd", "bnd", "bob", "brl", "bsd", "bwp", "byn", "bzd", "cad", "cdf", "chf", "clp", "cny", "cop", "crc", "cve", "czk", "djf", "dkk", "dop", "dzd", "egp", "etb", "eur", "fjd", "fkp", "gbp", "gel", "ghs", "gip", "gmd", "gnf", "gtq", "gyd", "hkd", "hnl", "htg", "huf", "idr", "ils", "inr", "isk", "jmd", "jod", "jpy", "kes", "kgs", "khr", "kmf", "krw", "kwd", "kyd", "kzt", "lak", "lbp", "lkr", "lrd", "lsl", "mad", "mdl", "mga", "mkd", "mmk", "mnt", "mop", "mur", "mvr", "mwk", "mxn", "myr", "mzn", "nad", "ngn", "nio", "nok", "npr", "nzd", "omr", "pab", "pen", "pgk", "php", "pkr", "pln", "pyg", "qar", "ron", "rsd", "rub", "rwf", "sar", "sbd", "scr", "sek", "sgd", "shp", "sle", "sos", "srd", "std", "szl", "thb", "tjs", "tnd", "top", "try", "ttd", "twd", "tzs", "uah", "ugx", "usd", "uyu", "uzs", "vnd", "vuv", "wst", "xaf", "xcd", "xof", "xpf", "yer", "zar", "zmw"];
                                readonly description: "`solana_sol` `solana_usdc` `aed` `afn` `all` `amd` `ang` `aoa` `ars` `aud` `awg` `azn` `bam` `bbd` `bdt` `bgn` `bhd` `bif` `bmd` `bnd` `bob` `brl` `bsd` `bwp` `byn` `bzd` `cad` `cdf` `chf` `clp` `cny` `cop` `crc` `cve` `czk` `djf` `dkk` `dop` `dzd` `egp` `etb` `eur` `fjd` `fkp` `gbp` `gel` `ghs` `gip` `gmd` `gnf` `gtq` `gyd` `hkd` `hnl` `htg` `huf` `idr` `ils` `inr` `isk` `jmd` `jod` `jpy` `kes` `kgs` `khr` `kmf` `krw` `kwd` `kyd` `kzt` `lak` `lbp` `lkr` `lrd` `lsl` `mad` `mdl` `mga` `mkd` `mmk` `mnt` `mop` `mur` `mvr` `mwk` `mxn` `myr` `mzn` `nad` `ngn` `nio` `nok` `npr` `nzd` `omr` `pab` `pen` `pgk` `php` `pkr` `pln` `pyg` `qar` `ron` `rsd` `rub` `rwf` `sar` `sbd` `scr` `sek` `sgd` `shp` `sle` `sos` `srd` `std` `szl` `thb` `tjs` `tnd` `top` `try` `ttd` `twd` `tzs` `uah` `ugx` `usd` `uyu` `uzs` `vnd` `vuv` `wst` `xaf` `xcd` `xof` `xpf` `yer` `zar` `zmw`";
                            };
                            readonly is_flexible: {
                                readonly type: "boolean";
                            };
                            readonly min_cents: {
                                readonly anyOf: readonly [{
                                    readonly type: "integer";
                                    readonly minimum: 0;
                                    readonly maximum: 9007199254740991;
                                }, {
                                    readonly type: "null";
                                }];
                            };
                            readonly api_id: {
                                readonly type: "string";
                            };
                        };
                    }];
                    readonly type: "object";
                    readonly required: readonly ["api_id"];
                };
            };
            readonly required: readonly ["ticket_type"];
        };
    };
};
declare const PostV1EventUpdate: {
    readonly body: {
        readonly $schema: "https://json-schema.org/draft/2020-12/schema";
        readonly type: "object";
        readonly properties: {
            readonly event_api_id: {
                readonly type: "string";
            };
            readonly can_register_for_multiple_tickets: {
                readonly type: "boolean";
            };
            readonly cover_url: {
                readonly description: "Specify an image that has been uploaded to the Luma CDN. You can upload an image after getting an upload URL from the Luma API.";
                readonly type: "string";
                readonly format: "uri";
                readonly pattern: "^https:\\/\\/images\\.lumacdn\\.com\\/.*";
            };
            readonly coordinate: {
                readonly type: "object";
                readonly properties: {
                    readonly longitude: {
                        readonly type: "number";
                    };
                    readonly latitude: {
                        readonly type: "number";
                    };
                };
                readonly required: readonly ["longitude", "latitude"];
            };
            readonly description_md: {
                readonly description: "Luma stores rich text in a special format called Spark. We don't expose an API for that format, but we can convert Markdown to Spark for you. Some Spark features, like Luma event embeds, are not supported by Markdown.";
                readonly type: "string";
            };
            readonly end_at: {
                readonly description: "ISO 8601 Datetime. For example, 2022-10-19T03:27:13.673Z";
                readonly type: "string";
                readonly format: "date-time";
                readonly pattern: "^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d+)?)?(?:Z|([+-](?:[01]\\d|2[0-3]):[0-5]\\d)))$";
            };
            readonly geo_address_json: {
                readonly anyOf: readonly [{
                    readonly type: "object";
                    readonly properties: {
                        readonly type: {
                            readonly type: "string";
                            readonly const: "manual";
                        };
                        readonly address: {
                            readonly type: "string";
                        };
                    };
                    readonly required: readonly ["type", "address"];
                }, {
                    readonly type: "object";
                    readonly properties: {
                        readonly type: {
                            readonly type: "string";
                            readonly const: "google";
                        };
                        readonly place_id: {
                            readonly type: "string";
                        };
                        readonly description: {
                            readonly anyOf: readonly [{
                                readonly type: "string";
                            }, {
                                readonly type: "null";
                            }];
                        };
                    };
                    readonly required: readonly ["type", "place_id"];
                }];
            };
            readonly max_capacity: {
                readonly description: "Once an event hits the max capacity, the event will be marked as sold out and registration will automatically be closed.\n\nIf `can_register_for_multiple_tickets` is `true`, each ticket will count towards the max capacity.";
                readonly anyOf: readonly [{
                    readonly type: "integer";
                    readonly minimum: -9007199254740991;
                    readonly maximum: 9007199254740991;
                }, {
                    readonly type: "null";
                }];
            };
            readonly meeting_url: {
                readonly type: "string";
            };
            readonly name: {
                readonly type: "string";
            };
            readonly name_requirement: {
                readonly description: "Luma collects the name of every guest as they register. Choose if you'd like to split this into two fields to encourage guests to enter their first and last name.";
                readonly type: "string";
                readonly enum: readonly ["full-name", "first-last"];
            };
            readonly phone_number_requirement: {
                readonly anyOf: readonly [{
                    readonly type: "string";
                    readonly enum: readonly ["optional", "required"];
                }, {
                    readonly type: "null";
                }];
            };
            readonly registration_questions: {
                readonly type: "array";
                readonly items: {
                    readonly anyOf: readonly [{
                        readonly type: "object";
                        readonly properties: {
                            readonly id: {
                                readonly type: "string";
                            };
                            readonly label: {
                                readonly type: "string";
                            };
                            readonly required: {
                                readonly type: "boolean";
                            };
                            readonly question_type: {
                                readonly type: "string";
                                readonly const: "agree-check";
                            };
                        };
                        readonly required: readonly ["id", "label", "required", "question_type"];
                    }, {
                        readonly type: "object";
                        readonly properties: {
                            readonly id: {
                                readonly type: "string";
                            };
                            readonly label: {
                                readonly type: "string";
                            };
                            readonly required: {
                                readonly type: "boolean";
                            };
                            readonly question_type: {
                                readonly type: "string";
                                readonly const: "company";
                            };
                            readonly collect_job_title: {
                                readonly type: "boolean";
                            };
                            readonly job_title_label: {
                                readonly type: "string";
                            };
                        };
                        readonly required: readonly ["id", "label", "required", "question_type"];
                    }, {
                        readonly type: "object";
                        readonly properties: {
                            readonly id: {
                                readonly type: "string";
                            };
                            readonly label: {
                                readonly type: "string";
                            };
                            readonly required: {
                                readonly type: "boolean";
                            };
                            readonly question_type: {
                                readonly type: "string";
                                readonly const: "dropdown";
                            };
                            readonly options: {
                                readonly maxItems: 250;
                                readonly type: "array";
                                readonly items: {
                                    readonly type: "string";
                                };
                            };
                        };
                        readonly required: readonly ["id", "label", "required", "question_type", "options"];
                    }, {
                        readonly type: "object";
                        readonly properties: {
                            readonly id: {
                                readonly type: "string";
                            };
                            readonly label: {
                                readonly type: "string";
                            };
                            readonly required: {
                                readonly type: "boolean";
                            };
                            readonly question_type: {
                                readonly type: "string";
                                readonly const: "github";
                            };
                        };
                        readonly required: readonly ["id", "label", "required", "question_type"];
                    }, {
                        readonly type: "object";
                        readonly properties: {
                            readonly id: {
                                readonly type: "string";
                            };
                            readonly label: {
                                readonly type: "string";
                            };
                            readonly required: {
                                readonly type: "boolean";
                            };
                            readonly question_type: {
                                readonly type: "string";
                                readonly const: "instagram";
                            };
                        };
                        readonly required: readonly ["id", "label", "required", "question_type"];
                    }, {
                        readonly type: "object";
                        readonly properties: {
                            readonly id: {
                                readonly type: "string";
                            };
                            readonly label: {
                                readonly type: "string";
                            };
                            readonly required: {
                                readonly type: "boolean";
                            };
                            readonly question_type: {
                                readonly type: "string";
                                readonly const: "linkedin";
                            };
                        };
                        readonly required: readonly ["id", "label", "required", "question_type"];
                    }, {
                        readonly type: "object";
                        readonly properties: {
                            readonly id: {
                                readonly type: "string";
                            };
                            readonly label: {
                                readonly type: "string";
                            };
                            readonly required: {
                                readonly type: "boolean";
                            };
                            readonly question_type: {
                                readonly type: "string";
                                readonly const: "long-text";
                            };
                        };
                        readonly required: readonly ["id", "label", "required", "question_type"];
                    }, {
                        readonly type: "object";
                        readonly properties: {
                            readonly id: {
                                readonly type: "string";
                            };
                            readonly label: {
                                readonly type: "string";
                            };
                            readonly required: {
                                readonly type: "boolean";
                            };
                            readonly question_type: {
                                readonly type: "string";
                                readonly const: "multi-select";
                            };
                            readonly options: {
                                readonly maxItems: 250;
                                readonly type: "array";
                                readonly items: {
                                    readonly type: "string";
                                };
                            };
                        };
                        readonly required: readonly ["id", "label", "required", "question_type", "options"];
                    }, {
                        readonly type: "object";
                        readonly properties: {
                            readonly id: {
                                readonly type: "string";
                            };
                            readonly label: {
                                readonly type: "string";
                            };
                            readonly required: {
                                readonly type: "boolean";
                            };
                            readonly question_type: {
                                readonly type: "string";
                                readonly const: "phone-number";
                            };
                        };
                        readonly required: readonly ["id", "label", "required", "question_type"];
                    }, {
                        readonly type: "object";
                        readonly properties: {
                            readonly id: {
                                readonly type: "string";
                            };
                            readonly label: {
                                readonly type: "string";
                            };
                            readonly required: {
                                readonly type: "boolean";
                            };
                            readonly question_type: {
                                readonly type: "string";
                                readonly const: "telegram";
                            };
                        };
                        readonly required: readonly ["id", "label", "required", "question_type"];
                    }, {
                        readonly type: "object";
                        readonly properties: {
                            readonly id: {
                                readonly type: "string";
                            };
                            readonly label: {
                                readonly type: "string";
                            };
                            readonly required: {
                                readonly type: "boolean";
                            };
                            readonly question_type: {
                                readonly type: "string";
                                readonly const: "twitter";
                            };
                        };
                        readonly required: readonly ["id", "label", "required", "question_type"];
                    }, {
                        readonly type: "object";
                        readonly properties: {
                            readonly id: {
                                readonly type: "string";
                            };
                            readonly label: {
                                readonly type: "string";
                            };
                            readonly required: {
                                readonly type: "boolean";
                            };
                            readonly question_type: {
                                readonly type: "string";
                                readonly const: "text";
                            };
                        };
                        readonly required: readonly ["id", "label", "required", "question_type"];
                    }, {
                        readonly type: "object";
                        readonly properties: {
                            readonly id: {
                                readonly type: "string";
                            };
                            readonly label: {
                                readonly type: "string";
                            };
                            readonly required: {
                                readonly type: "boolean";
                            };
                            readonly question_type: {
                                readonly type: "string";
                                readonly const: "url";
                            };
                        };
                        readonly required: readonly ["id", "label", "required", "question_type"];
                    }, {
                        readonly type: "object";
                        readonly properties: {
                            readonly id: {
                                readonly type: "string";
                            };
                            readonly label: {
                                readonly type: "string";
                            };
                            readonly required: {
                                readonly type: "boolean";
                            };
                            readonly question_type: {
                                readonly type: "string";
                                readonly const: "youtube";
                            };
                        };
                        readonly required: readonly ["id", "label", "required", "question_type"];
                    }];
                };
            };
            readonly reminders_disabled: {
                readonly description: "By default, Luma will send reminders before the event. Turn off if you'd like more control over event communications.";
                readonly type: "boolean";
            };
            readonly show_guest_list: {
                readonly description: "When the guest list is shown, approved guests will be able to see who else is going to the event.";
                readonly type: "boolean";
            };
            readonly slug: {
                readonly description: "The URL slug for the event. If the slug is `aloha`, the URL will be `https://luma.com/aloha`. If the slug is not available, the event creation will fail.\n\nYou can use `/public/v1/entity/lookup` to check if a slug is available.";
                readonly type: "string";
                readonly minLength: 3;
                readonly maxLength: 50;
            };
            readonly start_at: {
                readonly description: "ISO 8601 Datetime. For example, 2022-10-19T03:27:13.673Z";
                readonly type: "string";
                readonly format: "date-time";
                readonly pattern: "^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d+)?)?(?:Z|([+-](?:[01]\\d|2[0-3]):[0-5]\\d)))$";
            };
            readonly timezone: {
                readonly description: "IANA Timezone, e.g. America/New_York. https://en.wikipedia.org/wiki/List_of_tz_database_time_zones";
                readonly type: "string";
            };
            readonly tint_color: {
                readonly description: "A hex color like '#bb2dc7'. Alpha channels (#rgba, #rrggbbaa) are automatically stripped.";
                readonly type: "string";
            };
            readonly visibility: {
                readonly type: "string";
                readonly enum: readonly ["public", "members-only", "private"];
            };
        };
        readonly required: readonly ["event_api_id"];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly description: "Empty response";
            readonly properties: {};
            readonly additionalProperties: false;
            readonly "x-stainless-empty-object": true;
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const PostV1EventUpdateCoupon: {
    readonly body: {
        readonly $schema: "https://json-schema.org/draft/2020-12/schema";
        readonly type: "object";
        readonly properties: {
            readonly event_api_id: {
                readonly type: "string";
            };
            readonly code: {
                readonly type: "string";
            };
            readonly remaining_count: {
                readonly type: "integer";
                readonly minimum: -9007199254740991;
                readonly maximum: 9007199254740991;
            };
            readonly valid_start_at: {
                readonly anyOf: readonly [{
                    readonly description: "ISO 8601 Datetime. For example, 2022-10-19T03:27:13.673Z";
                    readonly type: "string";
                    readonly format: "date-time";
                    readonly pattern: "^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d+)?)?(?:Z|([+-](?:[01]\\d|2[0-3]):[0-5]\\d)))$";
                }, {
                    readonly type: "null";
                }];
            };
            readonly valid_end_at: {
                readonly anyOf: readonly [{
                    readonly description: "ISO 8601 Datetime. For example, 2022-10-19T03:27:13.673Z";
                    readonly type: "string";
                    readonly format: "date-time";
                    readonly pattern: "^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d+)?)?(?:Z|([+-](?:[01]\\d|2[0-3]):[0-5]\\d)))$";
                }, {
                    readonly type: "null";
                }];
            };
        };
        readonly required: readonly ["event_api_id", "code"];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly description: "Empty response";
            readonly properties: {};
            readonly additionalProperties: false;
            readonly "x-stainless-empty-object": true;
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const PostV1EventUpdateGuestStatus: {
    readonly body: {
        readonly $schema: "https://json-schema.org/draft/2020-12/schema";
        readonly type: "object";
        readonly properties: {
            readonly guest: {
                readonly anyOf: readonly [{
                    readonly type: "object";
                    readonly properties: {
                        readonly type: {
                            readonly type: "string";
                            readonly const: "email";
                        };
                        readonly email: {
                            readonly type: "string";
                        };
                    };
                    readonly required: readonly ["type", "email"];
                }, {
                    readonly type: "object";
                    readonly properties: {
                        readonly type: {
                            readonly type: "string";
                            readonly const: "api_id";
                        };
                        readonly api_id: {
                            readonly type: "string";
                        };
                    };
                    readonly required: readonly ["type", "api_id"];
                }];
            };
            readonly event_api_id: {
                readonly type: "string";
            };
            readonly status: {
                readonly type: "string";
                readonly enum: readonly ["declined", "approved"];
            };
            readonly should_refund: {
                readonly description: "If you are declining a guest and they have paid, should we refund their payment?";
                readonly type: "boolean";
            };
        };
        readonly required: readonly ["guest", "event_api_id", "status"];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly description: "Empty response";
            readonly properties: {};
            readonly additionalProperties: false;
            readonly "x-stainless-empty-object": true;
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const PostV1ImagesCreateUploadUrl: {
    readonly body: {
        readonly $schema: "https://json-schema.org/draft/2020-12/schema";
        readonly type: "object";
        readonly properties: {
            readonly purpose: {
                readonly type: "string";
                readonly enum: readonly ["event-cover"];
            };
            readonly content_type: {
                readonly anyOf: readonly [{
                    readonly type: "string";
                    readonly enum: readonly ["image/jpeg", "image/png"];
                }, {
                    readonly type: "null";
                }];
            };
        };
        readonly required: readonly ["purpose"];
    };
    readonly response: {
        readonly "200": {
            readonly $schema: "https://json-schema.org/draft/2020-12/schema";
            readonly type: "object";
            readonly properties: {
                readonly upload_url: {
                    readonly description: "You'll upload your image here using a PUT request.";
                    readonly type: "string";
                };
                readonly file_url: {
                    readonly type: "string";
                };
            };
            readonly required: readonly ["upload_url", "file_url"];
        };
    };
};
declare const PostV1MembershipsMembersAdd: {
    readonly body: {
        readonly $schema: "https://json-schema.org/draft/2020-12/schema";
        readonly type: "object";
        readonly properties: {
            readonly email: {
                readonly type: "string";
                readonly format: "email";
                readonly pattern: "^(?!\\.)(?!.*\\.\\.)([A-Za-z0-9_'+\\-\\.]*)[A-Za-z0-9_+-]@([A-Za-z0-9][A-Za-z0-9\\-]*\\.)+[A-Za-z]{2,}$";
            };
            readonly membership_tier_id: {
                readonly type: "string";
            };
            readonly registration_answers: {
                readonly type: "array";
                readonly items: {
                    readonly anyOf: readonly [{
                        readonly type: "object";
                        readonly properties: {
                            readonly label: {
                                readonly type: "string";
                            };
                            readonly question_id: {
                                readonly type: "string";
                            };
                            readonly value: {
                                readonly type: "boolean";
                            };
                            readonly answer: {
                                readonly type: "boolean";
                            };
                            readonly question_type: {
                                readonly type: "string";
                                readonly const: "agree-check";
                            };
                        };
                        readonly required: readonly ["label", "question_id", "value", "question_type"];
                    }, {
                        readonly type: "object";
                        readonly properties: {
                            readonly label: {
                                readonly type: "string";
                            };
                            readonly question_id: {
                                readonly type: "string";
                            };
                            readonly value: {
                                readonly type: "object";
                                readonly properties: {
                                    readonly company: {
                                        readonly anyOf: readonly [{
                                            readonly type: "string";
                                        }, {
                                            readonly type: "null";
                                        }];
                                    };
                                    readonly job_title: {
                                        readonly anyOf: readonly [{
                                            readonly type: "string";
                                        }, {
                                            readonly type: "null";
                                        }];
                                    };
                                };
                            };
                            readonly answer: {
                                readonly anyOf: readonly [{
                                    readonly type: "string";
                                }, {
                                    readonly type: "null";
                                }];
                            };
                            readonly answer_company: {
                                readonly anyOf: readonly [{
                                    readonly type: "string";
                                }, {
                                    readonly type: "null";
                                }];
                            };
                            readonly answer_job_title: {
                                readonly anyOf: readonly [{
                                    readonly type: "string";
                                }, {
                                    readonly type: "null";
                                }];
                            };
                            readonly question_type: {
                                readonly type: "string";
                                readonly const: "company";
                            };
                        };
                        readonly required: readonly ["label", "question_id", "value", "question_type"];
                    }, {
                        readonly type: "object";
                        readonly properties: {
                            readonly label: {
                                readonly type: "string";
                            };
                            readonly question_id: {
                                readonly type: "string";
                            };
                            readonly value: {
                                readonly anyOf: readonly [{
                                    readonly type: "string";
                                }, {
                                    readonly type: "null";
                                }];
                            };
                            readonly answer: {
                                readonly anyOf: readonly [{
                                    readonly type: "string";
                                }, {
                                    readonly type: "null";
                                }];
                            };
                            readonly question_type: {
                                readonly type: "string";
                                readonly const: "dropdown";
                            };
                        };
                        readonly required: readonly ["label", "question_id", "value", "question_type"];
                    }, {
                        readonly type: "object";
                        readonly properties: {
                            readonly label: {
                                readonly type: "string";
                            };
                            readonly question_id: {
                                readonly type: "string";
                            };
                            readonly value: {
                                readonly anyOf: readonly [{
                                    readonly type: "array";
                                    readonly items: {
                                        readonly type: "string";
                                    };
                                }, {
                                    readonly type: "null";
                                }];
                            };
                            readonly answer: {
                                readonly anyOf: readonly [{
                                    readonly type: "array";
                                    readonly items: {
                                        readonly type: "string";
                                    };
                                }, {
                                    readonly type: "null";
                                }];
                            };
                            readonly question_type: {
                                readonly type: "string";
                                readonly const: "multi-select";
                            };
                        };
                        readonly required: readonly ["label", "question_id", "value", "question_type"];
                    }, {
                        readonly type: "object";
                        readonly properties: {
                            readonly label: {
                                readonly type: "string";
                            };
                            readonly question_id: {
                                readonly type: "string";
                            };
                            readonly value: {
                                readonly anyOf: readonly [{
                                    readonly type: "string";
                                }, {
                                    readonly type: "null";
                                }];
                            };
                            readonly answer: {
                                readonly anyOf: readonly [{
                                    readonly type: "string";
                                }, {
                                    readonly type: "null";
                                }];
                            };
                            readonly question_type: {
                                readonly type: "string";
                                readonly const: "phone-number";
                            };
                        };
                        readonly required: readonly ["label", "question_id", "value", "question_type"];
                    }, {
                        readonly type: "object";
                        readonly properties: {
                            readonly label: {
                                readonly type: "string";
                            };
                            readonly question_id: {
                                readonly type: "string";
                            };
                            readonly value: {
                                readonly anyOf: readonly [{
                                    readonly anyOf: readonly [{
                                        readonly type: "string";
                                    }, {
                                        readonly type: "boolean";
                                        readonly const: true;
                                    }];
                                }, {
                                    readonly type: "null";
                                }];
                            };
                            readonly answer: {
                                readonly anyOf: readonly [{
                                    readonly anyOf: readonly [{
                                        readonly type: "string";
                                    }, {
                                        readonly type: "boolean";
                                        readonly const: true;
                                    }];
                                }, {
                                    readonly type: "null";
                                }];
                            };
                            readonly question_type: {
                                readonly type: "string";
                                readonly const: "terms";
                            };
                        };
                        readonly required: readonly ["label", "question_id", "value", "question_type"];
                    }, {
                        readonly type: "object";
                        readonly properties: {
                            readonly label: {
                                readonly type: "string";
                            };
                            readonly question_id: {
                                readonly type: "string";
                            };
                            readonly value: {
                                readonly anyOf: readonly [{
                                    readonly type: "string";
                                }, {
                                    readonly type: "null";
                                }];
                            };
                            readonly answer: {
                                readonly anyOf: readonly [{
                                    readonly type: "string";
                                }, {
                                    readonly type: "null";
                                }];
                            };
                            readonly question_type: {
                                readonly anyOf: readonly [{
                                    readonly type: "string";
                                    readonly const: "github";
                                }, {
                                    readonly type: "string";
                                    readonly const: "instagram";
                                }, {
                                    readonly type: "string";
                                    readonly const: "linkedin";
                                }, {
                                    readonly type: "string";
                                    readonly const: "long-text";
                                }, {
                                    readonly type: "string";
                                    readonly const: "telegram";
                                }, {
                                    readonly type: "string";
                                    readonly const: "text";
                                }, {
                                    readonly type: "string";
                                    readonly const: "twitter";
                                }, {
                                    readonly type: "string";
                                    readonly const: "youtube";
                                }];
                            };
                        };
                        readonly required: readonly ["label", "question_id", "value", "question_type"];
                    }, {
                        readonly type: "object";
                        readonly properties: {
                            readonly label: {
                                readonly type: "string";
                            };
                            readonly question_id: {
                                readonly type: "string";
                            };
                            readonly value: {
                                readonly anyOf: readonly [{
                                    readonly type: "string";
                                }, {
                                    readonly type: "null";
                                }];
                            };
                            readonly answer: {
                                readonly anyOf: readonly [{
                                    readonly type: "string";
                                }, {
                                    readonly type: "null";
                                }];
                            };
                            readonly question_type: {
                                readonly type: "string";
                                readonly const: "url";
                            };
                        };
                        readonly required: readonly ["label", "question_id", "value", "question_type"];
                    }];
                };
            };
        };
        readonly required: readonly ["email", "membership_tier_id"];
    };
    readonly response: {
        readonly "200": {
            readonly $schema: "https://json-schema.org/draft/2020-12/schema";
            readonly type: "object";
            readonly properties: {
                readonly membership_id: {
                    readonly type: "string";
                };
                readonly status: {
                    readonly type: "string";
                    readonly enum: readonly ["approved", "pending", "declined"];
                    readonly description: "`approved` `pending` `declined`";
                };
            };
            readonly required: readonly ["membership_id", "status"];
        };
    };
};
declare const PostV1MembershipsMembersUpdateStatus: {
    readonly body: {
        readonly $schema: "https://json-schema.org/draft/2020-12/schema";
        readonly type: "object";
        readonly properties: {
            readonly user_id: {
                readonly description: "User ID (e.g., 'usr-xxx') or email address";
                readonly type: "string";
            };
            readonly status: {
                readonly type: "string";
                readonly enum: readonly ["approved", "declined"];
            };
        };
        readonly required: readonly ["user_id", "status"];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly description: "Empty response";
            readonly properties: {};
            readonly additionalProperties: false;
            readonly "x-stainless-empty-object": true;
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const PostV1WebhooksCreate: {
    readonly body: {
        readonly $schema: "https://json-schema.org/draft/2020-12/schema";
        readonly type: "object";
        readonly properties: {
            readonly url: {
                readonly type: "string";
                readonly format: "uri";
                readonly pattern: "^http.*";
            };
            readonly event_types: {
                readonly minItems: 1;
                readonly type: "array";
                readonly items: {
                    readonly type: "string";
                    readonly enum: readonly ["*", "calendar.event.added", "calendar.person.subscribed", "event.created", "event.updated", "guest.registered", "guest.updated", "ticket.registered"];
                };
            };
        };
        readonly required: readonly ["url", "event_types"];
    };
    readonly response: {
        readonly "200": {
            readonly $schema: "https://json-schema.org/draft/2020-12/schema";
            readonly type: "object";
            readonly properties: {
                readonly webhook: {
                    readonly type: "object";
                    readonly properties: {
                        readonly id: {
                            readonly type: "string";
                        };
                        readonly url: {
                            readonly type: "string";
                        };
                        readonly event_types: {
                            readonly type: "array";
                            readonly items: {
                                readonly type: "string";
                                readonly enum: readonly ["*", "calendar.event.added", "calendar.person.subscribed", "event.created", "event.updated", "guest.registered", "guest.updated", "ticket.registered"];
                                readonly description: "`*` `calendar.event.added` `calendar.person.subscribed` `event.created` `event.updated` `guest.registered` `guest.updated` `ticket.registered`";
                            };
                        };
                        readonly status: {
                            readonly type: "string";
                            readonly enum: readonly ["active", "paused"];
                            readonly description: "`active` `paused`";
                        };
                        readonly secret: {
                            readonly type: "string";
                        };
                        readonly created_at: {
                            readonly description: "ISO 8601 Datetime. For example, 2022-10-19T03:27:13.673Z";
                            readonly type: "string";
                            readonly format: "date-time";
                            readonly pattern: "^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d+)?)?(?:Z|([+-](?:[01]\\d|2[0-3]):[0-5]\\d)))$";
                        };
                    };
                    readonly required: readonly ["id", "url", "event_types", "status", "secret", "created_at"];
                };
            };
            readonly required: readonly ["webhook"];
        };
    };
};
declare const PostV1WebhooksDelete: {
    readonly body: {
        readonly $schema: "https://json-schema.org/draft/2020-12/schema";
        readonly type: "object";
        readonly properties: {
            readonly id: {
                readonly type: "string";
            };
        };
        readonly required: readonly ["id"];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly description: "Empty response";
            readonly properties: {};
            readonly additionalProperties: false;
            readonly "x-stainless-empty-object": true;
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const PostV1WebhooksUpdate: {
    readonly body: {
        readonly $schema: "https://json-schema.org/draft/2020-12/schema";
        readonly type: "object";
        readonly properties: {
            readonly id: {
                readonly type: "string";
            };
            readonly event_types: {
                readonly minItems: 1;
                readonly type: "array";
                readonly items: {
                    readonly type: "string";
                    readonly enum: readonly ["*", "calendar.event.added", "calendar.person.subscribed", "event.created", "event.updated", "guest.registered", "guest.updated", "ticket.registered"];
                };
            };
            readonly status: {
                readonly type: "string";
                readonly enum: readonly ["active", "paused"];
            };
        };
        readonly required: readonly ["id"];
    };
    readonly response: {
        readonly "200": {
            readonly $schema: "https://json-schema.org/draft/2020-12/schema";
            readonly type: "object";
            readonly properties: {
                readonly webhook: {
                    readonly type: "object";
                    readonly properties: {
                        readonly id: {
                            readonly type: "string";
                        };
                        readonly url: {
                            readonly type: "string";
                        };
                        readonly event_types: {
                            readonly type: "array";
                            readonly items: {
                                readonly type: "string";
                                readonly enum: readonly ["*", "calendar.event.added", "calendar.person.subscribed", "event.created", "event.updated", "guest.registered", "guest.updated", "ticket.registered"];
                                readonly description: "`*` `calendar.event.added` `calendar.person.subscribed` `event.created` `event.updated` `guest.registered` `guest.updated` `ticket.registered`";
                            };
                        };
                        readonly status: {
                            readonly type: "string";
                            readonly enum: readonly ["active", "paused"];
                            readonly description: "`active` `paused`";
                        };
                        readonly secret: {
                            readonly type: "string";
                        };
                        readonly created_at: {
                            readonly description: "ISO 8601 Datetime. For example, 2022-10-19T03:27:13.673Z";
                            readonly type: "string";
                            readonly format: "date-time";
                            readonly pattern: "^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d+)?)?(?:Z|([+-](?:[01]\\d|2[0-3]):[0-5]\\d)))$";
                        };
                    };
                    readonly required: readonly ["id", "url", "event_types", "status", "secret", "created_at"];
                };
            };
            readonly required: readonly ["webhook"];
        };
    };
};
export { GetV1CalendarCoupons, GetV1CalendarListEvents, GetV1CalendarListPeople, GetV1CalendarListPersonTags, GetV1CalendarLookupEvent, GetV1EntityLookup, GetV1EventCoupons, GetV1EventGet, GetV1EventGetGuest, GetV1EventGetGuests, GetV1EventTicketTypesGet, GetV1EventTicketTypesList, GetV1MembershipsTiersList, GetV1UserGetSelf, GetV1WebhooksGet, GetV1WebhooksList, PostV1CalendarAddEvent, PostV1CalendarCouponsCreate, PostV1CalendarCouponsUpdate, PostV1CalendarCreatePersonTag, PostV1CalendarDeletePersonTag, PostV1CalendarImportPeople, PostV1CalendarPersonTagsApply, PostV1CalendarPersonTagsUnapply, PostV1CalendarUpdatePersonTag, PostV1EventAddGuests, PostV1EventAddHost, PostV1EventCreate, PostV1EventCreateCoupon, PostV1EventSendInvites, PostV1EventTicketTypesCreate, PostV1EventTicketTypesDelete, PostV1EventTicketTypesUpdate, PostV1EventUpdate, PostV1EventUpdateCoupon, PostV1EventUpdateGuestStatus, PostV1ImagesCreateUploadUrl, PostV1MembershipsMembersAdd, PostV1MembershipsMembersUpdateStatus, PostV1WebhooksCreate, PostV1WebhooksDelete, PostV1WebhooksUpdate };
