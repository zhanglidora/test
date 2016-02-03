/**
 * @provideModule DocumentCreationStore
 */

 'use strict';

var Global = require('../utils/Global');
var TimerMixin = require('react-timer-mixin');

/** Stores and Actions **/
var CreationActions = require('../actions/CreationActions');
var moment = require('moment');

var DocumentAsyncStorageMixin = require('../mixins/DocumentAsyncStorageMixin');
var AudioAsyncStorageMixin = require('../mixins/AudioAsyncStorageMixin');

const FIELDS = [
  {field: {sectionTitle: 'COMPONENTS'}},
  {field: {fieldTitle: 'Authoring For', fieldId: 'oboAuthor'}},
  {field: {fieldTitle: 'Product', fieldId: 'productType'}},
  {field: {fieldTitle: 'Title', fieldId: 'title'}},
  {field: {fieldTitle: 'Headline', fieldId: 'headline'}},
  {field: {fieldTitle: 'Front Page Bullets', fieldId: 'frontPageBullets'}},
  {field: {sectionTitle: 'ASSETS'}},
  {field: {fieldTitle: 'Video', fieldId: 'video'}},
  {field: {fieldTitle: 'Audio', fieldId: 'audio'}}
];

var bulletTemplate = `<ul>
    <li><span class="list-prefix">Citi's Take</span><span class="list-content">:&nbsp;</span></li>
    <li><span class="list-content">&nbsp;</span></li>
    <li><span class="list-content">&nbsp;</span></li>
    <li><span class="list-prefix">Implications</span><span class="list-content">:&nbsp;</span></li>
  </ul>`;


var emptyDoc = {
  meta: FIELDS,
  oboAuthor: 'Unselected',
  productType: 'Unselected',
  title: {
    displayTitle: '',
    content: ''
  },
  headline: {
    displayTitle: '',
    content: ''
  },
  frontPageBullets: {
    displayTitle: '',
    content: bulletTemplate
  },
  audio: {},
  video: {},
  type: '',
  status: 'Draft',
  index: '',
  updateTime: '',
};

module.exports = Reflux.createStore({
  listenables: [CreationActions],
  mixins: [
    TimerMixin,
    DocumentAsyncStorageMixin,
    AudioAsyncStorageMixin
  ],

  init() {
    this.data = {
      ongoingDocument: {},
      docList: [],
      selectedAudio: {},
    };
    this.initOngoingDoc();
  },

  initOngoingDoc() {
    this.data.ongoingDocument = _.cloneDeep(emptyDoc);
    this.data.ongoingDocument.id = Global.guid();
  },

  onRestoreDocList() {
    this.restoreDocListFromStorage().then(docList => {
      this.data.docList = docList;
      this.trigger(this.data);
    });
  },

  onSelectOboAuthor(oboAuthor) {
    this.data.ongoingDocument.oboAuthor = oboAuthor;
    this.trigger(this.data);
  },

  onSelectProfile(id) {
    switch(id) {
      case '1':
        this.data.ongoingDocument.productType = 'Company Alert';
        this.data.ongoingDocument.title = {
          displayTitle: 'test',
          content: '<p>test</p>'
        };
        break;
      case '2':
        this.data.ongoingDocument.productType = 'Industry Alert';
        this.data.ongoingDocument.title = {
          displayTitle: '456',
          content: '<p>456</p>'
        };
        break;
      case '3':
        this.data.ongoingDocument.productType = 'Company Results';
        this.data.ongoingDocument.title = {
          displayTitle: '123xyz',
          content: '<p>123xyz</p>'
        };
        break;
    }
    this.trigger(this.data);
  },

  onSelectProductType(productType) {
    this.data.ongoingDocument.productType = productType;
    this.trigger(this.data);
  },

  onSaveEditorInput(fieldId, title, editorInput) {
    this.data.ongoingDocument[fieldId] = {
      displayTitle: title,
      content: editorInput
    };
    this.trigger(this.data);
  },

  onSaveDocument(ongoingDocument) {
    this.saveDocumentToStorage(ongoingDocument).then(() => {
      return this.addToReferencedList(ongoingDocument);
    }).then(() => {
      let date = moment().format('L');
      this.data.ongoingDocument.updateTime = date;
      let foundIndex = _.findIndex(this.data.docList, {id: ongoingDocument.id});
      if(foundIndex < 0){
        this.data.docList.push(this.data.ongoingDocument);
      }else{
        this.data.docList[foundIndex] = this.data.ongoingDocument;
      }
      this.initOngoingDoc();
      this.trigger(this.data);
    });
  },

  onExitEditDoc() {
    this.initOngoingDoc();
    this.trigger(this.data);
  },

  onSelectDocument(docId) {
    var selectedDoc = _.findWhere(this.data.docList, {id: docId});
    this.data.ongoingDocument = _.clone(selectedDoc);
    this.trigger(this.data);
  },

  onDeleteDocument(docId) {
    this.deleteDocumentFromStorage(docId).then(audioId => {
      return this.removeFromReferencedList(audioId, docId);
    }).then(() => {
      this.data.docList = _.remove(this.data.docList, item => item.id !== docId);
      this.trigger(this.data);
    });
  },

  onSubmitDocument(docId) {
    this.changeToSubmitStatusFromStorage(docId).then(audioId => {
      return this.removeFromReferencedList(audioId, docId);
    }).then(() => {
      let selectedDoc = _.findWhere(this.data.docList, {id: docId});
      selectedDoc.status = 'Submitted';
      this.trigger(this.data);
      CreationActions.submitDocument.completed();
    });
  },

  onSaveVideo(video){
    this.data.ongoingDocument.video = video;
    this.trigger(this.data);
  },

  onAddAudioToDocument(audio) {
    this.data.ongoingDocument.audio = audio;
    this.trigger(this.data);
  }
});
