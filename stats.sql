

DROP table stats.owa_action_fact ;

-- Step 2: Create the Table with BIGINT for relevant columns
CREATE TABLE IF NOT EXISTS stats.owa_action_fact (
    id BIGINT PRIMARY KEY,
    visitor_id BIGINT,
    session_id BIGINT,
    site_id VARCHAR(50),
    referer_id BIGINT, -- Changed from INT to BIGINT
    ua_id BIGINT,       -- Changed from INT to BIGINT (some UA IDs also look large)
    host_id BIGINT,     -- Changed from INT to BIGINT (some Host IDs also look large)
    os_id BIGINT,       -- Changed from INT to BIGINT (some OS IDs also look large)
    location_id BIGINT,
    referring_search_term_id INT,
    `timestamp` BIGINT,
    yyyymmdd INT,
    `year` INT,
    `month` INT,
    `day` INT,
    dayofweek VARCHAR(10),
    dayofyear INT,
    weekofyear INT,
    last_req BIGINT,
    ip_address VARCHAR(45),
    is_new_visitor BOOLEAN,
    is_repeat_visitor BOOLEAN,
    `language` VARCHAR(20),
    days_since_prior_session INT,
    days_since_first_session INT,
    num_prior_sessions INT,
    medium VARCHAR(50),
    source_id BIGINT,
    ad_id INT,
    campaign_id INT,
    user_name VARCHAR(100),
    cv1_name VARCHAR(100),
    cv1_value VARCHAR(100),
    cv2_name VARCHAR(100),
    cv2_value VARCHAR(100),
    cv3_name VARCHAR(100),
    cv3_value VARCHAR(100),
    cv4_name VARCHAR(100),
    cv4_value VARCHAR(100),
    cv5_name VARCHAR(100),
    cv5_value VARCHAR(100),
    document_id BIGINT,
    action_name VARCHAR(100),
    action_label TEXT,
    action_group VARCHAR(50),
    numeric_value INT
);

INSERT INTO stats.owa_action_fact (id,visitor_id,session_id,site_id,referer_id,ua_id,host_id,os_id,location_id,referring_search_term_id,`timestamp`,yyyymmdd,`year`,`month`,`day`,dayofweek,dayofyear,weekofyear,last_req,ip_address,is_new_visitor,is_repeat_visitor,`language`,days_since_prior_session,days_since_first_session,num_prior_sessions,medium,source_id,ad_id,campaign_id,user_name,cv1_name,cv1_value,cv2_name,cv2_value,cv3_name,cv3_value,cv4_name,cv4_value,cv5_name,cv5_value,document_id,action_name,action_label,action_group,numeric_value) VALUES
	 (0,0,0,'',0,0,0,0,0,0,0,0,0,0,0,'',0,0,0,'',0,0,'',0,5,2,'referral',2208530091,0,0,'','login','sdldemo','(not set)','(not set)','(not set)','(not set)','(not set)','(not set)','(not set)','(not set)',1150456838,'downloads','http://search.mandumah.com/record/573224#sv#pdf-img#9802-016-002-0068-c.pdf#dissertations#','content',1),
	 (1704056401495883110,1704055944877137716,1704055944313968993,'def3bb50ce71476a851a7d13f9d81baa',2831829274,4094721055,146471012,2461840941,20446937,118221093,1704056401,20240101,2024,202401,1,'Mon',0,1,1704056375,'195.43.22.135',0,1,'ar-EG',0,0,1,'referral',109973018,0,0,'','login','egyptkb','(not set)','(not set)','(not set)','(not set)','(not set)','(not set)','(not set)','(not set)',2621816164,'downloads','https://search.mandumah.com/record/216146#sv#pdf-img#0089-078-002-007.pdf#edusearch#','content',1),
	 (1704056404087787110,1704056128267694482,1704056128047549216,'def3bb50ce71476a851a7d13f9d81baa',2831829274,1405489236,146471012,2461840941,20446937,118221093,1704056404,20240101,2024,202401,1,'Mon',0,1,1704056395,'195.43.22.135',0,1,'ar-EG',0,0,1,'referral',109973018,0,0,'','login','egyptkb','(not set)','(not set)','(not set)','(not set)','(not set)','(not set)','(not set)','(not set)',223042992,'downloads','https://search.mandumah.com/record/1077107#dv#pdf-img#1876-000-005-001.pdf#edusearch#','content',1),
	 (1704056409819414112,1704055589862788112,1704055589596109392,'def3bb50ce71476a851a7d13f9d81baa',118221093,1368173120,146471012,3823601051,20446937,118221093,1704056409,20240101,2024,202401,1,'Mon',0,1,1704055942,'195.43.22.140',0,1,'en-US',0,0,1,'direct',118221093,0,0,'','login','egyptkb','(not set)','(not set)','(not set)','(not set)','(not set)','(not set)','(not set)','(not set)',4154152599,'downloads','https://search.mandumah.com/record/1338274#sv#pdf-img#9801-002-033-0007-1.pdf#dissertations#','content',1),
	 (1704056412633622112,1704055331066180747,1704055331117317060,'def3bb50ce71476a851a7d13f9d81baa',2831829274,2891383280,146471012,2461840941,20446937,118221093,1704056412,20240101,2024,202401,1,'Mon',0,1,1704056387,'195.43.22.140',0,1,'en-GB',0,0,1,'referral',109973018,0,0,'','login','egyptkb','(not set)','(not set)','(not set)','(not set)','(not set)','(not set)','(not set)','(not set)',1251116857,'downloads','https://search.mandumah.com/record/1418049#sv#pdf-img#0054-000-075-016.pdf#edusearch#','content',1),
	 (1704056413690579112,1703959658337034895,1703959658706547701,'def3bb50ce71476a851a7d13f9d81baa',118221093,1670784603,146471012,3823601051,20446937,118221093,1704056413,20240101,2024,202401,1,'Mon',0,1,1704056111,'195.43.22.135',0,1,'en-US',0,1,1,'direct',118221093,0,0,'','login','egyptkb','(not set)','(not set)','(not set)','(not set)','(not set)','(not set)','(not set)','(not set)',3807451093,'downloads','https://search.mandumah.com/record/1026620#dv#pdf-img#9802-028-010-0007-3.pdf#dissertations#','content',1),
	 (1704056418514669112,1694208754498016395,1704056369834425255,'def3bb50ce71476a851a7d13f9d81baa',118221093,1670784603,1690316461,3823601051,2545900857,118221093,1704056418,20240101,2024,202401,1,'Mon',0,1,1704056384,'86.108.11.20',0,1,'ar,en',0,114,18,'direct',118221093,0,0,'','login','yuedu','(not set)','(not set)','(not set)','(not set)','(not set)','(not set)','(not set)','(not set)',1721044828,'downloads','https://ezproxy.yu.edu.jo:2278/record/1056993#sv#pdf-img#9802-015-014-0322-3.pdf#dissertations#','content',1),
	 (1704056421292652112,1704088815818469765,1704088815513019766,'def3bb50ce71476a851a7d13f9d81baa',2831829274,3377206350,146471012,1669813451,20446937,118221093,1704056421,20240101,2024,202401,1,'Mon',0,1,1704092353,'195.43.22.136',0,1,'en-US',0,0,1,'referral',109973018,0,0,'','login','egyptkb','(not set)','(not set)','(not set)','(not set)','(not set)','(not set)','(not set)','(not set)',3639735664,'downloads','https://search.mandumah.com/record/1232727#sv#pdf-txt#0225-032-125-016x.pdf#edusearch#','content',1),
	 (1704056422608069112,1704091517406307708,1704091517664849886,'def3bb50ce71476a851a7d13f9d81baa',2831829274,1670784603,146471012,3823601051,20446937,118221093,1704056422,20240101,2024,202401,1,'Mon',0,1,1704091586,'195.43.22.134',0,1,'ar-EG',0,0,1,'referral',109973018,0,0,'','login','egyptkb','(not set)','(not set)','(not set)','(not set)','(not set)','(not set)','(not set)','(not set)',3245963625,'downloads','https://search.mandumah.com/record/507533#sv#pdf-img#6768-002-000-015.pdf#islamicinfo#','content',1),
	 (1704056427498278112,1703426098206048329,1704056407196251087,'def3bb50ce71476a851a7d13f9d81baa',118221093,3031828740,1690316461,2085328441,2545900857,118221093,1704056427,20240101,2024,202401,1,'Mon',0,1,1704056418,'86.108.11.20',0,1,'en-US',7,7,3,'direct',118221093,0,0,'','login','yuedu','(not set)','(not set)','(not set)','(not set)','(not set)','(not set)','(not set)','(not set)',2916439161,'downloads','https://ezproxy.yu.edu.jo:2278/record/952067#sv#pdf-img#9802-003-003-2351-f.pdf#dissertations#','content',1);
