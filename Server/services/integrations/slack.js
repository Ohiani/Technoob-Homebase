
const { getSlackNotificationModuleDefaults,createFieldsBlock } = require("../../utils/utils");
const { sendRequest, respondToAction, openModal } = require("../../utils/slack/index");
const config = require("../../config/config")
 /**
     * @function notifySlack
     * @param {object} { moduleType, notificationData,image }
     * @returns {object} { message }
     * @throws {Error} 
     */
 async function notifySlack ({ moduleType, notificationData,image,activityTag }) {
    try {
        const fields = Object.keys(notificationData).map((key) => {
            return {
                label: key.replace("_"," "),
                value: notificationData[key]
            }
        })

        const { slackPayload, channel} = moduleTypeCreator({
            moduleType,
            fields,
            image,
            activityTag
        })
        await sendRequest({
            body: slackPayload,
            webhook: {
                channel: channel
            }
        })
        return {
            message: `Notified ${channel}`
        }
    } catch (error) {
        console.error(error)
        throw error
    }
 }



function moduleTypeCreator({ moduleType,image,fields, activityTag}) {
    try {

        const { payload, channel } = getSlackNotificationModuleDefaults({
            moduleType,fields,image,activityTag
        })
        
        const { sectionBlock, fieldsBlock, actionsBlock  } = payload
        const slackPayload = {
            "blocks": [sectionBlock, fieldsBlock, actionsBlock]
        };
        return {
            slackPayload,
            channel: channel
        };
    } catch (error) {
        throw error;
    }
}

async function notifyActionResponse({ text, responseUrl,messageBlock }) {
    try {
        const resp = await respondToAction({
            responseUrl,
            text,
            messageBlock,
            replace_original: true
        })
        return resp
    } catch (error) {
        throw error;
    }
}

async function notifyActionResponseV2({  trigger_id, slackPayload, modal_identifier }) {
    try {
        let respPayload = {
            trigger_id,
            view: slackPayload,
            modal_identifier
        }
        const resp = await openModal(respPayload)
        return resp.data
    } catch (error) {
        throw error;
    }
}

async function notifyActionResponseNoError({ text, responseUrl, messageBlock, isSuccessful,thread_ts }) {
    try {
        let slackPayload;
        const originalMessageBlock = messageBlock
        if (isSuccessful) {
            //hide buttons from original message block
            const { payload} = getSlackNotificationModuleDefaults({
                moduleType: "notifyScrapedJobApprovalResponseRender",
                fields: null,
                image: null,
                activityTag: null,
                originalMessageBlock,
                text,
                isSuccessful
            })
            const  { sectionBlock, fieldsBlock, actionsBlock,responseTextBlock }  = payload
            slackPayload = {
                "blocks": [sectionBlock, fieldsBlock, actionsBlock, responseTextBlock].filter((comp) => {
                    if (comp) {
                        return comp
                    }
                })
            }; 
        } else {
            //re-render original message block with error
            const { payload } = getSlackNotificationModuleDefaults({
                moduleType: "notifyScrapedJobApprovalResponseRender",
                fields: null,
                image: null,
                activityTag: null,
                originalMessageBlock,
                text,
                isSuccessful: false
            })
            const  { sectionBlock, fieldsBlock, actionsBlock,responseTextBlock }  = payload
            slackPayload = {
                "blocks": [sectionBlock, fieldsBlock, actionsBlock,responseTextBlock].filter((comp) => {
                    if (comp) {
                        return comp
                    }
                })
            };
        }
        let respPayload = {
            responseUrl,
            payload: slackPayload,
            replace_original: true,
            thread_ts
        }
        if (thread_ts) {
            respPayload.replace_original = false
            respPayload.response_type = "in_channel"
        }
        const resp = await respondToAction(respPayload)
        return resp
    } catch (error) {
        console.error(`Notify Action Response Error:${error.message || error}`)
    }
}


function moduleExtractor({ action }) {
    const delimiterSeperation = action?.value?.split(":");
    const activityTag = delimiterSeperation[0];
    const moduleType = delimiterSeperation[1];
    const reaction = delimiterSeperation[2]

    return {
        activityTag,
        moduleType,
        reaction
    }
}

function retrieveCommandFunction(name) {
    if (!name) {
        return null
    }
    if (name === "renderEmailPlaceholdersModal") {
        return renderEmailPlaceholdersModal
    }
    return null
}

const divider = {
    "type": "divider"
}

async function renderEmailPlaceholdersModal({identifier,username}) {
    try {
        if (!identifier) {
            throw new Error("Provide an identifier to identify the template to be used")
        }
        const emailModel = require('../../models/email_templates');
        const email = await emailModel.findOne({
            $or: [
                {
                    name: identifier
                },
                {
                    id: identifier
                }
            ]
        })
        if (!email) {
            throw new Error(`${identifier} not found`)
        }
        const emailPlaceholders = email.placeholders;
        
        const inputBlockArray = emailPlaceholders.map((placeholder) => {
            return  {
                "type": "input",
                "label": {
                    "type": "plain_text",
                    "text": `${placeholder.name}`,
                    "emoji": true
                },
                "element": {
                    "type": "plain_text_input",
                    "multiline": true
                },
                "optional": placeholder.isRequired ? true : false
            }
        })

        const promptSectionBlock = {
			"type": "section",
			"text": {
				"type": "plain_text",
				"text": `:wave: Hey ${username.split('.')[0]}!\n\n The email template provided requires some placeholders`,
				"emoji": true
			}
        }
    

        const slackPayload = {
            "type": "modal",
            "callback_id": "renderEmailPlaceholdersModal",
            "title": {
                "type": "plain_text",
                "text": `${email.name}`,
                "emoji": true
            },
            "submit": {
                "type": "plain_text",
                "text": "Render Email",
                "emoji": true
            },
            "close": {
                "type": "plain_text",
                "text": "Cancel",
                "emoji": true
            },
            "blocks": [promptSectionBlock, divider, ...inputBlockArray]
        };

        slackPayload.private_metadata = JSON.stringify({
            selectedTemplate: email.name
        });


        return {
            slackPayload,
            modal_identifier: "renderEmailPlaceholdersModal"
        }
    } catch (error) {
        throw error;
    }
}

function buildQueryString(params) {
    const queryString = Object.keys(params)
        .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
        .join('&');
    const fieldsMap = Object.keys(params).map((key) => {
        return {
            label: key,
            value: params[key]
        }
    })
    return {
        queryString,
        fieldsMap
    };
}

async function renderEmailPreview(body) {
    try {
        const { view: { blocks, title, state, private_metadata } } = body;
        let placeHolders = {}
        if (Array.isArray(blocks)) {
            blocks.forEach((block) => {
                if (block && block.type === "input") {
                    placeHolders[block.label?.text] = state.values[block.block_id][block.element.action_id].value;
                }
            })
        }
        let queryString = ''
        let fieldsMap = []

        if (Object.keys(placeHolders).length !== 0) {
            let buildQuery= buildQueryString(placeHolders);
            fieldsMap = buildQuery.fieldsMap;
            queryString = buildQuery.queryString;

        }

        const promptSectionBlock = {
			"type": "section",
			"text": {
				"type": "mrkdwn",
				"text": `:wave: Kindly use this link to preview the email content <https://${config.LIVE_BASE_URL}/api/v1/admin/email/preview/${title.text}?${queryString}|here>`
			}
        }
        
        const placehOlderFieldBlock = createFieldsBlock(fieldsMap,null)

        const slackPayload = {
            type: "modal",
            callback_id: "renderEmailPreview",
            title: {
                type: "plain_text",
                text: `Step 2/3`
            },
            submit: {
                type: "plain_text",
                text: "Select Recipients",
                emoji: true
            },
            close: {
                type: "plain_text",
                text: "Cancel",
                emoji: true
            },
            blocks: [promptSectionBlock,divider,placehOlderFieldBlock]
        };

        if (private_metadata && Object.keys(placeHolders).length !== 0) {
            const prev = JSON.parse(private_metadata);
            const newMeta = JSON.stringify({ ...prev, placeHolders })
            slackPayload.private_metadata = newMeta
        }
        
        return {
            slackPayload,
            modal_identifier: "renderEmailPreview"
        }

    } catch (error) {
        throw error;
    }
}

async function renderInputRecepientsModal(body) {
    try {
        const { view: { blocks, title, state, private_metadata }, team } = body;
        const pickMailingListSectionBlock = {
			"type": "section",
			"text": {
				"type": "mrkdwn",
				"text": `Pick a mailing list`
            },
            "accessory": {
                "action_id": `mailing_list:${team.domain}`,
                "type": "external_select",
                "placeholder": {
                    "type": "plain_text",
                    "text": "Select a mailing list"
                },
                "min_query_length": 2,
                "focus_on_load": true
            }
        }

        const slackPayload = {
            type: "modal",
            callback_id: "renderInputRecepientsModal",
            title: {
                type: "plain_text",
                text:`Step 3/3`
            },
            submit: {
                type: "plain_text",
                text: "Confirm Details",
                emoji: true
            },
            close: {
                type: "plain_text",
                text: "Cancel",
                emoji: true
            },
            blocks: [pickMailingListSectionBlock]
        };

        if (private_metadata) {
            slackPayload.private_metadata = private_metadata
        }
        return {
            slackPayload,
            modal_identifier: "renderEmailPreview"
        }
    } catch (error) {
        throw error;
    }
}

async function previewSubmission(body) {
    try {
        const { view: { blocks, title, state, private_metadata } } = body;

        const prev_metadata = JSON.parse(private_metadata)
        const placeHolders = prev_metadata.placeHolders;
        let buildQuery = buildQueryString(placeHolders);
        let queryString = buildQuery.queryString;
        const fieldsMap = buildQuery.fieldsMap;
        const placehOlderFieldBlock = createFieldsBlock(fieldsMap, null)
        
        const selectedMailingGroup = state.values[blocks[0].block_id][blocks[0].accessory.action_id].selected_option.value;
        const owner = blocks[0].accessory.action_id.split(":")[1]
        const { message } = await renderMailingListInfo({
            groupName: selectedMailingGroup,
            owner
        })

        const slackPayload = {
            type: "modal",
            callback_id: "previewSubmission",
            title: {
                type: "plain_text",
                text:`Content Preview`
            },
            submit: {
                type: "plain_text",
                text: "Confirm Details",
                emoji: true
            },
            close: {
                type: "plain_text",
                text: "Cancel",
                emoji: true
            },
            blocks: [
                {
                    "type": "header",
                    "text": {
                        "type": "plain_text",
                        "text": ":tada: You're all set! This is your request summary."
                    }
                },
                {
                    "type": "context",
                    "elements": [
                        {
                            "type": "mrkdwn",
                            "text": "Placeholders to be replaced"
                        }
                    ]
                },
                {
                    "type": "divider"
                },
                placehOlderFieldBlock,
                {
                    "type": "context",
                    "elements": [
                        {
                            "type": "mrkdwn",
                            "text": ":m: Recipients Summary"
                        }
                    ]
                },
                {
                    "type": "divider"
                },
                {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": message
                    }
                },
                {
                    "type": "context",
                    "elements": [
                        {
                            "type": "mrkdwn",
                            "text": " Email Preview link"
                        }
                    ]
                },
                {
                    "type": "divider"
                },
                {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": `:wave: Kindly use this link to preview the email content <https://${config.LIVE_BASE_URL}/api/v1/admin/email/preview/${prev_metadata.selectedTemplate}?${queryString}|here>`
                    }
                }
            ]
        };

        const new_metadata = {
            ...prev_metadata, groupName:selectedMailingGroup,owner
        }
        slackPayload.private_metadata = JSON.stringify(new_metadata)

        return {
            slackPayload,
            modal_identifier: "previewSubmission"
        }
    } catch (error) {
        throw error
    }
}

async function processSubmission(body) {
    try {
        const { view: { blocks, title, state, private_metadata } } = body;
        const processingData = JSON.parse(private_metadata);

        
        return {
            "response_action": "clear"
          }
    } catch (error) {
        
    }
}

function servicePicker({ moduleType, reaction  }) {
    const { approveScrapedJob, rejectScrapedJob } = require("../jobs");
    const moduleActionsServiceMap = {
        notifyScrapedJobApproval: {
            approve_scraped_jobs: approveScrapedJob,
            remove_scraped_jobs: rejectScrapedJob
        },
        mailing_list: renderMailingListInfo
    }
    return moduleActionsServiceMap[moduleType]?.[reaction] || null;
}

function servicePickerExternalSource({ activityTag  }) {
    const moduleActionsServiceMap = {
        mailing_list: renderMailingListInfo
    }
    return moduleActionsServiceMap[activityTag] || null;
}

async function renderMailingListInfo({ groupName,owner, }) {
    try {
        const mailingList = require("../../models/mailing_list");
        const groupId = `${owner}:${groupName}`
        const retrieveEmails = await mailingList.find({
            groupId
        })
        return {
            message: `You selected your "${groupName}" list. The list has a total of ${retrieveEmails.length} emails.`,

        }
    } catch (err) {
        throw err
    }
}

const commandMap = {
    "/sendemailwithtemplate": {
        requiresText: true,
        responseHandler: {
            argsCount: 1,
            requiredArgsCount: 1,
            name: "renderEmailPlaceholdersModal",
            argsValidator: null,
            modal_identifier: "renderEmailPlaceholdersModal",
            invalidArgsCountMessage: `This command requires you to provide the template name or ID. It should be in this format. *\\/\\renderEmailPlaceholdersModal invite_admin* . \n Where invite_admin is the template name or ID`,
            argsBuilder: (body) => {
                const args = body.text.split("0");
                return {
                    identifier: args[0],
                    username: body.user_name
                }
            },
            stepsCount: 3
        },
        enabled: true
    } 
}

const stepOrder = new Map([
    ["renderEmailPlaceholdersModal", "renderEmailPreview"],
    ["renderEmailPreview", "renderInputRecepientsModal"],
    ["renderInputRecepientsModal", "previewSubmission"],
    ["previewSubmission", "processSubmission"]
])

const stepMap = {
    renderEmailPlaceholdersModal,
    renderEmailPreview,
    renderInputRecepientsModal,
    previewSubmission,
    processSubmission
}

async function nextStepPickerRunner(body) {
    const nextStep = stepOrder.get(body.view.callback_id);
    if (nextStep) {
        return await stepMap[nextStep](body);
    } else {
        return "done"
    } 
}

async function processAction({ body }) {
    try {
        const { type, callback_id,actions  } = body;
        if (!body) {
            throw new Error("No interaction body provided")
        }
        if (type === "block_actions" ) {
            const { activityTag, moduleType, reaction } = moduleExtractor({ action: actions[0] });
            const userInfo = body.user;
            const reactionService = await servicePicker({ moduleType, reaction });
            const runReaction = await reactionService({ activityTag, userInfo });
            return {
                message: runReaction?.message || "Run successfully"
            }
        } else if (type === "view_submission") {
            const { message, slackPayload, modal_identifier } = await nextStepPickerRunner(body);
            return {
                message,
                slackPayload,
                modal_identifier
            }
            
        } else {
            throw new Error(` Type is not configured`)
        }

    } catch (error) {
        console.log(error)
        throw new Error(`Failed to run: ${error.message || error}`)
    }
}

function optionsRender(ops) {
    const optionsDropdown = ops.map((op) => {
        return {
            "text": {
                "type": "plain_text",
                "text": op.text
            },
            "value": op.value
        }
    }) || []
    return optionsDropdown
} 
const menuRenderRunner = {
    mailing_list: async function ({action_id, value}) {
        try {
            const mailingList = require('../../models/mailing_list_grouping');
            const owner = action_id.split(":")[1];
            const list = await mailingList.find(
                {
                    groupName: { $regex: value, $options: 'i' },
                    owner
                }
            )
            if (list && !list.length) {
                return optionsRender([])
            }
            const options = list.map((each) => {
                return {
                    text: each.groupName,
                    value: each.groupName
                  }
              })
            return optionsRender(options)
        } catch (error) {
            throw error
        }
    }
}

async function fetchMenus({ body }) {
    try {
        const { type, callback_id , action_id, value} = body;
        if (!body) {
            throw new Error("No interaction body provided")
        }
        if (type === 'block_suggestion') {
            const menuModule = action_id.split(":")[0];
            const renderMenu  = await menuRenderRunner[menuModule](body);
            return {
                options: renderMenu
            }
            
        } else {
            return {
                options: []
            }
        }

    } catch (error) {
        throw new Error(`Failed to run: ${error.message || error}`)
    }
}

module.exports = {
    notifySlack,
    moduleTypeCreator,
    notifyActionResponse,
    processAction,
    notifyActionResponseNoError,
    retrieveCommandFunction,
    notifyActionResponseV2,
    commandMap,
    fetchMenus
}