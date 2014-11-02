# encoding: utf-8
import datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models

class Migration(SchemaMigration):

    def forwards(self, orm):
        db.rename_column(u'spud_category', 'category', 'title')
        db.rename_column(u'spud_category', 'sortname', 'sort_name')
        db.rename_column(u'spud_category', 'category_description', 'description')
        db.rename_column(u'spud_category', 'parent_category_id', 'parent_id')
        db.rename_column(u'spud_category', 'sortorder', 'sort_order')

        db.rename_column(u'spud_place', 'parent_place_id', 'parent_id')
        db.rename_column(u'spud_place', 'zip', 'postcode')

        db.rename_column(u'spud_album', 'album', 'title')
        db.rename_column(u'spud_album', 'parent_album_id', 'parent_id')
        db.rename_column(u'spud_album', 'sortorder', 'sort_order')
        db.rename_column(u'spud_album', 'sortname', 'sort_name')
        db.rename_column(u'spud_album', 'album_description', 'description')

    def backwards(self, orm):
        
        db.rename_column(u'spud_category', 'parent_id', 'parent_category_id')
        db.rename_column(u'spud_category', 'title', 'category')
        db.rename_column(u'spud_category', 'description', 'category_description')
        db.rename_column(u'spud_category', 'sort_name', 'sortname')
        db.rename_column(u'spud_category', 'sort_order', 'sortorder')

        db.rename_column(u'spud_place', 'parent_id', 'parent_place_id')
        db.rename_column(u'spud_place', 'postcode', 'zip')

        db.rename_column(u'spud_album', 'parent_id', 'parent_album_id')
        db.rename_column(u'spud_album', 'title', 'album')
        db.rename_column(u'spud_album', 'description', 'album_description')
        db.rename_column(u'spud_album', 'sort_name', 'sortname')
        db.rename_column(u'spud_album', 'sort_order', 'sortorder')


    models = {
        u'auth.group': {
            'Meta': {'object_name': 'Group'},
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '80'}),
            'permissions': ('django.db.models.fields.related.ManyToManyField', [], {'to': u"orm['auth.Permission']", 'symmetrical': 'False', 'blank': 'True'})
        },
        u'auth.permission': {
            'Meta': {'ordering': "(u'content_type__app_label', u'content_type__model', u'codename')", 'unique_together': "((u'content_type', u'codename'),)", 'object_name': 'Permission'},
            'codename': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'content_type': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['contenttypes.ContentType']"}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '50'})
        },
        u'auth.user': {
            'Meta': {'object_name': 'User'},
            'date_joined': ('django.db.models.fields.DateTimeField', [], {'default': 'datetime.datetime(2013, 5, 1, 9, 22, 29, 367936)'}),
            'email': ('django.db.models.fields.EmailField', [], {'max_length': '75', 'blank': 'True'}),
            'first_name': ('django.db.models.fields.CharField', [], {'max_length': '30', 'blank': 'True'}),
            'groups': ('django.db.models.fields.related.ManyToManyField', [], {'to': u"orm['auth.Group']", 'symmetrical': 'False', 'blank': 'True'}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'is_active': ('django.db.models.fields.BooleanField', [], {'default': 'True'}),
            'is_staff': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'is_superuser': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'last_login': ('django.db.models.fields.DateTimeField', [], {'default': 'datetime.datetime(2013, 5, 1, 9, 22, 29, 367503)'}),
            'last_name': ('django.db.models.fields.CharField', [], {'max_length': '30', 'blank': 'True'}),
            'password': ('django.db.models.fields.CharField', [], {'max_length': '128'}),
            'user_permissions': ('django.db.models.fields.related.ManyToManyField', [], {'to': u"orm['auth.Permission']", 'symmetrical': 'False', 'blank': 'True'}),
            'username': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '30'})
        },
        u'contenttypes.contenttype': {
            'Meta': {'ordering': "('name',)", 'unique_together': "(('app_label', 'model'),)", 'object_name': 'ContentType', 'db_table': "'django_content_type'"},
            'app_label': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'model': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '100'})
        },
        u'spud.album': {
            'Meta': {'ordering': "['sort_name', 'sort_order', 'title']", 'object_name': 'album'},
            'album_id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'cover_photo': ('django.db.models.fields.related.ForeignKey', [], {'blank': 'True', 'related_name': "'album_cover_of'", 'null': 'True', 'to': u"orm['spud.photo']"}),
            'description': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'parent': ('django.db.models.fields.related.ForeignKey', [], {'blank': 'True', 'related_name': "'children'", 'null': 'True', 'to': u"orm['spud.album']"}),
            'revised': ('django.db.models.fields.DateTimeField', [], {'null': 'True', 'blank': 'True'}),
            'sort_name': ('django.db.models.fields.CharField', [], {'max_length': '96', 'blank': 'True'}),
            'sort_order': ('django.db.models.fields.CharField', [], {'max_length': '96', 'blank': 'True'}),
            'title': ('django.db.models.fields.CharField', [], {'max_length': '96', 'db_index': 'True'})
        },
        u'spud.album_ascendant': {
            'Meta': {'ordering': "['position']", 'object_name': 'album_ascendant'},
            'ascendant': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'descendant_set'", 'to': u"orm['spud.album']"}),
            'descendant': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'ascendant_set'", 'to': u"orm['spud.album']"}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'position': ('django.db.models.fields.IntegerField', [], {})
        },
        u'spud.category': {
            'Meta': {'ordering': "['sort_name', 'sort_order', 'title']", 'object_name': 'category'},
            'category_id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'cover_photo': ('django.db.models.fields.related.ForeignKey', [], {'blank': 'True', 'related_name': "'category_cover_of'", 'null': 'True', 'to': u"orm['spud.photo']"}),
            'description': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'parent': ('django.db.models.fields.related.ForeignKey', [], {'blank': 'True', 'related_name': "'children'", 'null': 'True', 'to': u"orm['spud.category']"}),
            'sort_name': ('django.db.models.fields.CharField', [], {'max_length': '96', 'blank': 'True'}),
            'sort_order': ('django.db.models.fields.CharField', [], {'max_length': '96', 'blank': 'True'}),
            'title': ('django.db.models.fields.CharField', [], {'max_length': '96', 'db_index': 'True'})
        },
        u'spud.category_ascendant': {
            'Meta': {'ordering': "['position']", 'object_name': 'category_ascendant'},
            'ascendant': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'descendant_set'", 'to': u"orm['spud.category']"}),
            'descendant': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'ascendant_set'", 'to': u"orm['spud.category']"}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'position': ('django.db.models.fields.IntegerField', [], {})
        },
        u'spud.feedback': {
            'Meta': {'ordering': "('submit_datetime',)", 'object_name': 'feedback'},
            'comment': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'ip_address': ('django.db.models.fields.IPAddressField', [], {'max_length': '15', 'null': 'True', 'blank': 'True'}),
            'is_public': ('django.db.models.fields.BooleanField', [], {'default': 'True'}),
            'is_removed': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'parent': ('django.db.models.fields.related.ForeignKey', [], {'blank': 'True', 'related_name': "'children'", 'null': 'True', 'to': u"orm['spud.feedback']"}),
            'photo': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'feedbacks'", 'to': u"orm['spud.photo']"}),
            'rating': ('django.db.models.fields.IntegerField', [], {}),
            'submit_datetime': ('django.db.models.fields.DateTimeField', [], {}),
            'user': ('django.db.models.fields.related.ForeignKey', [], {'blank': 'True', 'related_name': "'photos_feedbacks'", 'null': 'True', 'to': u"orm['auth.User']"}),
            'user_email': ('django.db.models.fields.EmailField', [], {'max_length': '75', 'blank': 'True'}),
            'user_name': ('django.db.models.fields.CharField', [], {'max_length': '50', 'blank': 'True'}),
            'user_url': ('django.db.models.fields.URLField', [], {'max_length': '200', 'blank': 'True'}),
            'utc_offset': ('django.db.models.fields.IntegerField', [], {})
        },
        u'spud.feedback_ascendant': {
            'Meta': {'ordering': "['position']", 'object_name': 'feedback_ascendant'},
            'ascendant': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'descendant_set'", 'to': u"orm['spud.feedback']"}),
            'descendant': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'ascendant_set'", 'to': u"orm['spud.feedback']"}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'position': ('django.db.models.fields.IntegerField', [], {})
        },
        u'spud.person': {
            'Meta': {'ordering': "['last_name', 'first_name']", 'object_name': 'person'},
            'called': ('django.db.models.fields.CharField', [], {'max_length': '48', 'blank': 'True'}),
            'cover_photo': ('django.db.models.fields.related.ForeignKey', [], {'blank': 'True', 'related_name': "'person_cover_of'", 'null': 'True', 'to': u"orm['spud.photo']"}),
            'dob': ('django.db.models.fields.DateField', [], {'null': 'True', 'blank': 'True'}),
            'dod': ('django.db.models.fields.DateField', [], {'null': 'True', 'blank': 'True'}),
            'email': ('django.db.models.fields.CharField', [], {'max_length': '192', 'blank': 'True'}),
            'father': ('django.db.models.fields.related.ForeignKey', [], {'blank': 'True', 'related_name': "'father_of'", 'null': 'True', 'to': u"orm['spud.person']"}),
            'first_name': ('django.db.models.fields.CharField', [], {'db_index': 'True', 'max_length': '96', 'blank': 'True'}),
            'gender': ('django.db.models.fields.CharField', [], {'max_length': '1', 'blank': 'True'}),
            'home': ('django.db.models.fields.related.ForeignKey', [], {'blank': 'True', 'related_name': "'home_of'", 'null': 'True', 'to': u"orm['spud.place']"}),
            'last_name': ('django.db.models.fields.CharField', [], {'db_index': 'True', 'max_length': '96', 'blank': 'True'}),
            'middle_name': ('django.db.models.fields.CharField', [], {'max_length': '96', 'blank': 'True'}),
            'mother': ('django.db.models.fields.related.ForeignKey', [], {'blank': 'True', 'related_name': "'mother_of'", 'null': 'True', 'to': u"orm['spud.person']"}),
            'notes': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'person_id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'spouse': ('django.db.models.fields.related.ForeignKey', [], {'blank': 'True', 'related_name': "'reverse_spouses'", 'null': 'True', 'to': u"orm['spud.person']"}),
            'work': ('django.db.models.fields.related.ForeignKey', [], {'blank': 'True', 'related_name': "'work_of'", 'null': 'True', 'to': u"orm['spud.place']"})
        },
        u'spud.person_ascendant': {
            'Meta': {'ordering': "['position']", 'object_name': 'person_ascendant'},
            'ascendant': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'descendant_set'", 'to': u"orm['spud.person']"}),
            'descendant': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'ascendant_set'", 'to': u"orm['spud.person']"}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'position': ('django.db.models.fields.IntegerField', [], {})
        },
        u'spud.photo': {
            'Meta': {'ordering': "['datetime', 'photo_id']", 'object_name': 'photo'},
            'action': ('django.db.models.fields.CharField', [], {'db_index': 'True', 'max_length': '4', 'null': 'True', 'blank': 'True'}),
            'albums': ('django.db.models.fields.related.ManyToManyField', [], {'related_name': "'photos'", 'symmetrical': 'False', 'through': u"orm['spud.photo_album']", 'to': u"orm['spud.album']"}),
            'aperture': ('django.db.models.fields.CharField', [], {'max_length': '16', 'blank': 'True'}),
            'camera_make': ('django.db.models.fields.CharField', [], {'max_length': '32', 'blank': 'True'}),
            'camera_model': ('django.db.models.fields.CharField', [], {'max_length': '32', 'blank': 'True'}),
            'categorys': ('django.db.models.fields.related.ManyToManyField', [], {'related_name': "'photos'", 'symmetrical': 'False', 'through': u"orm['spud.photo_category']", 'to': u"orm['spud.category']"}),
            'ccd_width': ('django.db.models.fields.CharField', [], {'max_length': '16', 'blank': 'True'}),
            'comment': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'compression': ('django.db.models.fields.CharField', [], {'max_length': '64', 'blank': 'True'}),
            'datetime': ('django.db.models.fields.DateTimeField', [], {'db_index': 'True'}),
            'description': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'exposure': ('django.db.models.fields.CharField', [], {'max_length': '64', 'blank': 'True'}),
            'flash_used': ('django.db.models.fields.CharField', [], {'max_length': '1', 'blank': 'True'}),
            'focal_length': ('django.db.models.fields.CharField', [], {'max_length': '64', 'blank': 'True'}),
            'focus_dist': ('django.db.models.fields.CharField', [], {'max_length': '16', 'blank': 'True'}),
            'iso_equiv': ('django.db.models.fields.CharField', [], {'max_length': '8', 'blank': 'True'}),
            'level': ('django.db.models.fields.IntegerField', [], {}),
            'location': ('django.db.models.fields.related.ForeignKey', [], {'blank': 'True', 'related_name': "'photos'", 'null': 'True', 'to': u"orm['spud.place']"}),
            'metering_mode': ('django.db.models.fields.CharField', [], {'max_length': '32', 'blank': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'db_index': 'True', 'max_length': '128', 'blank': 'True'}),
            'path': ('django.db.models.fields.CharField', [], {'db_index': 'True', 'max_length': '255', 'blank': 'True'}),
            'persons': ('django.db.models.fields.related.ManyToManyField', [], {'related_name': "'photos'", 'symmetrical': 'False', 'through': u"orm['spud.photo_person']", 'to': u"orm['spud.person']"}),
            'photo_id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'photographer': ('django.db.models.fields.related.ForeignKey', [], {'blank': 'True', 'related_name': "'photographed'", 'null': 'True', 'to': u"orm['spud.person']"}),
            'rating': ('django.db.models.fields.FloatField', [], {'db_index': 'True', 'null': 'True', 'blank': 'True'}),
            'relations': ('django.db.models.fields.related.ManyToManyField', [], {'to': u"orm['spud.photo']", 'through': u"orm['spud.photo_relation']", 'symmetrical': 'False'}),
            'size': ('django.db.models.fields.IntegerField', [], {'null': 'True', 'blank': 'True'}),
            'timestamp': ('django.db.models.fields.DateTimeField', [], {}),
            'title': ('django.db.models.fields.CharField', [], {'db_index': 'True', 'max_length': '64', 'blank': 'True'}),
            'utc_offset': ('django.db.models.fields.IntegerField', [], {}),
            'view': ('django.db.models.fields.CharField', [], {'max_length': '64', 'blank': 'True'})
        },
        u'spud.photo_album': {
            'Meta': {'object_name': 'photo_album'},
            'album': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['spud.album']"}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'photo': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['spud.photo']"})
        },
        u'spud.photo_category': {
            'Meta': {'object_name': 'photo_category'},
            'category': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['spud.category']"}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'photo': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['spud.photo']"})
        },
        u'spud.photo_person': {
            'Meta': {'ordering': "['position']", 'object_name': 'photo_person'},
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'person': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['spud.person']"}),
            'photo': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['spud.photo']"}),
            'position': ('django.db.models.fields.IntegerField', [], {'null': 'True', 'blank': 'True'})
        },
        u'spud.photo_relation': {
            'Meta': {'object_name': 'photo_relation'},
            'desc_1': ('django.db.models.fields.CharField', [], {'max_length': '384'}),
            'desc_2': ('django.db.models.fields.CharField', [], {'max_length': '384'}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'photo_1': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'relations_1'", 'db_column': "'photo_id_1'", 'to': u"orm['spud.photo']"}),
            'photo_2': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'relations_2'", 'db_column': "'photo_id_2'", 'to': u"orm['spud.photo']"})
        },
        u'spud.photo_thumb': {
            'Meta': {'object_name': 'photo_thumb'},
            'height': ('django.db.models.fields.IntegerField', [], {'null': 'True', 'blank': 'True'}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'photo': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['spud.photo']"}),
            'size': ('django.db.models.fields.CharField', [], {'max_length': '10', 'db_index': 'True'}),
            'width': ('django.db.models.fields.IntegerField', [], {'null': 'True', 'blank': 'True'})
        },
        u'spud.place': {
            'Meta': {'ordering': "['title']", 'object_name': 'place'},
            'address': ('django.db.models.fields.CharField', [], {'max_length': '192', 'blank': 'True'}),
            'address2': ('django.db.models.fields.CharField', [], {'max_length': '192', 'blank': 'True'}),
            'city': ('django.db.models.fields.CharField', [], {'max_length': '96', 'blank': 'True'}),
            'country': ('django.db.models.fields.CharField', [], {'max_length': '96', 'blank': 'True'}),
            'cover_photo': ('django.db.models.fields.related.ForeignKey', [], {'blank': 'True', 'related_name': "'place_cover_of'", 'null': 'True', 'to': u"orm['spud.photo']"}),
            'notes': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'parent': ('django.db.models.fields.related.ForeignKey', [], {'blank': 'True', 'related_name': "'children'", 'null': 'True', 'to': u"orm['spud.place']"}),
            'place_id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'postcode': ('django.db.models.fields.CharField', [], {'max_length': '30', 'blank': 'True'}),
            'state': ('django.db.models.fields.CharField', [], {'max_length': '96', 'blank': 'True'}),
            'title': ('django.db.models.fields.CharField', [], {'max_length': '192', 'db_index': 'True'}),
            'url': ('django.db.models.fields.CharField', [], {'max_length': '3072', 'blank': 'True'}),
            'urldesc': ('django.db.models.fields.CharField', [], {'max_length': '96', 'blank': 'True'})
        },
        u'spud.place_ascendant': {
            'Meta': {'ordering': "['position']", 'object_name': 'place_ascendant'},
            'ascendant': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'descendant_set'", 'to': u"orm['spud.place']"}),
            'descendant': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'ascendant_set'", 'to': u"orm['spud.place']"}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'position': ('django.db.models.fields.IntegerField', [], {})
        }
    }

    complete_apps = ['spud']
