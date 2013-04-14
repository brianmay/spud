# spud - keep track of photos
# Copyright (C) 2008-2013 Brian May
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program.  If not, see <http://www.gnu.org/licenses/>.

# encoding: utf-8
import datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models

class Migration(SchemaMigration):
    
    def forwards(self, orm):
        
        # Deleting model 'queer'
        db.delete_table('spud_queer')

        # Removing M2M table for field add_categorys on 'queer'
        db.delete_table('spud_queer_add_categorys')

        # Removing M2M table for field delete_albums on 'queer'
        db.delete_table('spud_queer_delete_albums')

        # Removing M2M table for field add_persons on 'queer'
        db.delete_table('spud_queer_add_persons')

        # Removing M2M table for field add_albums on 'queer'
        db.delete_table('spud_queer_add_albums')

        # Removing M2M table for field delete_persons on 'queer'
        db.delete_table('spud_queer_delete_persons')

        # Removing M2M table for field delete_categorys on 'queer'
        db.delete_table('spud_queer_delete_categorys')
    
    
    def backwards(self, orm):
        
        # Adding model 'queer'
        db.create_table('spud_queer', (
            ('rotate', self.gf('django.db.models.fields.CharField')(max_length=4, null=True, blank=True)),
            ('name', self.gf('django.db.models.fields.CharField')(max_length=20)),
            ('update_description', self.gf('django.db.models.fields.TextField')(blank=True)),
            ('update_location', self.gf('django.db.models.fields.related.ForeignKey')(related_name='queer_updates', null=True, to=orm['spud.place'], blank=True)),
            ('update_status', self.gf('django.db.models.fields.CharField')(max_length=1, blank=True)),
            ('update_comment', self.gf('django.db.models.fields.TextField')(blank=True)),
            ('update_timezone', self.gf('django.db.models.fields.CharField')(max_length=100, blank=True)),
            ('update_title', self.gf('django.db.models.fields.CharField')(max_length=192, blank=True)),
            ('update_view', self.gf('django.db.models.fields.CharField')(max_length=192, blank=True)),
            ('update_photographer', self.gf('django.db.models.fields.related.ForeignKey')(related_name='queer_updates', null=True, to=orm['spud.person'], blank=True)),
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
        ))
        db.send_create_signal('spud', ['queer'])

        # Adding M2M table for field add_categorys on 'queer'
        db.create_table('spud_queer_add_categorys', (
            ('id', models.AutoField(verbose_name='ID', primary_key=True, auto_created=True)),
            ('queer', models.ForeignKey(orm['spud.queer'], null=False)),
            ('category', models.ForeignKey(orm['spud.category'], null=False))
        ))
        db.create_unique('spud_queer_add_categorys', ['queer_id', 'category_id'])

        # Adding M2M table for field delete_albums on 'queer'
        db.create_table('spud_queer_delete_albums', (
            ('id', models.AutoField(verbose_name='ID', primary_key=True, auto_created=True)),
            ('queer', models.ForeignKey(orm['spud.queer'], null=False)),
            ('album', models.ForeignKey(orm['spud.album'], null=False))
        ))
        db.create_unique('spud_queer_delete_albums', ['queer_id', 'album_id'])

        # Adding M2M table for field add_persons on 'queer'
        db.create_table('spud_queer_add_persons', (
            ('id', models.AutoField(verbose_name='ID', primary_key=True, auto_created=True)),
            ('queer', models.ForeignKey(orm['spud.queer'], null=False)),
            ('person', models.ForeignKey(orm['spud.person'], null=False))
        ))
        db.create_unique('spud_queer_add_persons', ['queer_id', 'person_id'])

        # Adding M2M table for field add_albums on 'queer'
        db.create_table('spud_queer_add_albums', (
            ('id', models.AutoField(verbose_name='ID', primary_key=True, auto_created=True)),
            ('queer', models.ForeignKey(orm['spud.queer'], null=False)),
            ('album', models.ForeignKey(orm['spud.album'], null=False))
        ))
        db.create_unique('spud_queer_add_albums', ['queer_id', 'album_id'])

        # Adding M2M table for field delete_persons on 'queer'
        db.create_table('spud_queer_delete_persons', (
            ('id', models.AutoField(verbose_name='ID', primary_key=True, auto_created=True)),
            ('queer', models.ForeignKey(orm['spud.queer'], null=False)),
            ('person', models.ForeignKey(orm['spud.person'], null=False))
        ))
        db.create_unique('spud_queer_delete_persons', ['queer_id', 'person_id'])

        # Adding M2M table for field delete_categorys on 'queer'
        db.create_table('spud_queer_delete_categorys', (
            ('id', models.AutoField(verbose_name='ID', primary_key=True, auto_created=True)),
            ('queer', models.ForeignKey(orm['spud.queer'], null=False)),
            ('category', models.ForeignKey(orm['spud.category'], null=False))
        ))
        db.create_unique('spud_queer_delete_categorys', ['queer_id', 'category_id'])
    
    
    models = {
        'spud.album': {
            'Meta': {'object_name': 'album', 'db_table': "u'zoph_albums'"},
            'album': ('django.db.models.fields.CharField', [], {'max_length': '96', 'db_index': 'True'}),
            'album_description': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'album_id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'coverphoto': ('django.db.models.fields.related.ForeignKey', [], {'blank': 'True', 'related_name': "'album_cover_of'", 'null': 'True', 'db_column': "'coverphoto'", 'to': "orm['spud.photo']"}),
            'parent_album': ('django.db.models.fields.related.ForeignKey', [], {'blank': 'True', 'related_name': "'children'", 'null': 'True', 'to': "orm['spud.album']"}),
            'revised': ('django.db.models.fields.DateTimeField', [], {'null': 'True', 'blank': 'True'}),
            'sortname': ('django.db.models.fields.CharField', [], {'max_length': '96', 'blank': 'True'}),
            'sortorder': ('django.db.models.fields.CharField', [], {'max_length': '96', 'blank': 'True'})
        },
        'spud.category': {
            'Meta': {'object_name': 'category', 'db_table': "u'zoph_categories'"},
            'category': ('django.db.models.fields.CharField', [], {'max_length': '96', 'db_index': 'True'}),
            'category_description': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'category_id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'coverphoto': ('django.db.models.fields.related.ForeignKey', [], {'blank': 'True', 'related_name': "'category_cover_of'", 'null': 'True', 'db_column': "'coverphoto'", 'to': "orm['spud.photo']"}),
            'parent_category': ('django.db.models.fields.related.ForeignKey', [], {'blank': 'True', 'related_name': "'children'", 'null': 'True', 'to': "orm['spud.category']"}),
            'sortname': ('django.db.models.fields.CharField', [], {'max_length': '96', 'blank': 'True'}),
            'sortorder': ('django.db.models.fields.CharField', [], {'max_length': '96', 'blank': 'True'})
        },
        'spud.person': {
            'Meta': {'object_name': 'person', 'db_table': "u'zoph_people'"},
            'called': ('django.db.models.fields.CharField', [], {'max_length': '48', 'blank': 'True'}),
            'coverphoto': ('django.db.models.fields.related.ForeignKey', [], {'blank': 'True', 'related_name': "'person_cover_of'", 'null': 'True', 'db_column': "'coverphoto'", 'to': "orm['spud.photo']"}),
            'dob': ('django.db.models.fields.DateField', [], {'null': 'True', 'blank': 'True'}),
            'dod': ('django.db.models.fields.DateField', [], {'null': 'True', 'blank': 'True'}),
            'email': ('django.db.models.fields.CharField', [], {'max_length': '192', 'blank': 'True'}),
            'father': ('django.db.models.fields.related.ForeignKey', [], {'blank': 'True', 'related_name': "'father_of'", 'null': 'True', 'to': "orm['spud.person']"}),
            'first_name': ('django.db.models.fields.CharField', [], {'db_index': 'True', 'max_length': '96', 'blank': 'True'}),
            'gender': ('django.db.models.fields.CharField', [], {'max_length': '1', 'blank': 'True'}),
            'home': ('django.db.models.fields.related.ForeignKey', [], {'blank': 'True', 'related_name': "'home_of'", 'null': 'True', 'to': "orm['spud.place']"}),
            'last_name': ('django.db.models.fields.CharField', [], {'db_index': 'True', 'max_length': '96', 'blank': 'True'}),
            'middle_name': ('django.db.models.fields.CharField', [], {'max_length': '96', 'blank': 'True'}),
            'mother': ('django.db.models.fields.related.ForeignKey', [], {'blank': 'True', 'related_name': "'mother_of'", 'null': 'True', 'to': "orm['spud.person']"}),
            'notes': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'person_id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'spouse': ('django.db.models.fields.related.ForeignKey', [], {'blank': 'True', 'related_name': "'reverse_spouses'", 'null': 'True', 'to': "orm['spud.person']"}),
            'work': ('django.db.models.fields.related.ForeignKey', [], {'blank': 'True', 'related_name': "'work_of'", 'null': 'True', 'to': "orm['spud.place']"})
        },
        'spud.photo': {
            'Meta': {'object_name': 'photo', 'db_table': "u'zoph_photos'"},
            'action': ('django.db.models.fields.CharField', [], {'db_index': 'True', 'max_length': '4', 'null': 'True', 'blank': 'True'}),
            'albums': ('django.db.models.fields.related.ManyToManyField', [], {'related_name': "'photos'", 'symmetrical': 'False', 'through': "orm['spud.photo_album']", 'to': "orm['spud.album']"}),
            'aperture': ('django.db.models.fields.CharField', [], {'max_length': '16', 'blank': 'True'}),
            'camera_make': ('django.db.models.fields.CharField', [], {'max_length': '32', 'blank': 'True'}),
            'camera_model': ('django.db.models.fields.CharField', [], {'max_length': '32', 'blank': 'True'}),
            'categorys': ('django.db.models.fields.related.ManyToManyField', [], {'related_name': "'photos'", 'symmetrical': 'False', 'through': "orm['spud.photo_category']", 'to': "orm['spud.category']"}),
            'ccd_width': ('django.db.models.fields.CharField', [], {'max_length': '16', 'blank': 'True'}),
            'comment': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'compression': ('django.db.models.fields.CharField', [], {'max_length': '64', 'blank': 'True'}),
            'datetime': ('django.db.models.fields.DateTimeField', [], {'db_index': 'True'}),
            'description': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'exposure': ('django.db.models.fields.CharField', [], {'max_length': '64', 'blank': 'True'}),
            'flash_used': ('django.db.models.fields.CharField', [], {'max_length': '1', 'blank': 'True'}),
            'focal_length': ('django.db.models.fields.CharField', [], {'max_length': '64', 'blank': 'True'}),
            'focus_dist': ('django.db.models.fields.CharField', [], {'max_length': '16', 'blank': 'True'}),
            'height': ('django.db.models.fields.IntegerField', [], {'null': 'True', 'blank': 'True'}),
            'iso_equiv': ('django.db.models.fields.CharField', [], {'max_length': '8', 'blank': 'True'}),
            'level': ('django.db.models.fields.IntegerField', [], {}),
            'location': ('django.db.models.fields.related.ForeignKey', [], {'blank': 'True', 'related_name': "'photos'", 'null': 'True', 'to': "orm['spud.place']"}),
            'metering_mode': ('django.db.models.fields.CharField', [], {'max_length': '32', 'blank': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'db_index': 'True', 'max_length': '128', 'blank': 'True'}),
            'path': ('django.db.models.fields.CharField', [], {'db_index': 'True', 'max_length': '255', 'blank': 'True'}),
            'persons': ('django.db.models.fields.related.ManyToManyField', [], {'related_name': "'photos'", 'symmetrical': 'False', 'through': "orm['spud.photo_person']", 'to': "orm['spud.person']"}),
            'photo_id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'photographer': ('django.db.models.fields.related.ForeignKey', [], {'blank': 'True', 'related_name': "'photographed'", 'null': 'True', 'to': "orm['spud.person']"}),
            'rating': ('django.db.models.fields.FloatField', [], {'db_index': 'True', 'null': 'True', 'blank': 'True'}),
            'relations': ('django.db.models.fields.related.ManyToManyField', [], {'to': "orm['spud.photo']", 'through': "orm['spud.photo_relation']", 'symmetrical': 'False'}),
            'size': ('django.db.models.fields.IntegerField', [], {'null': 'True', 'blank': 'True'}),
            'status': ('django.db.models.fields.CharField', [], {'db_index': 'True', 'max_length': '1', 'blank': 'True'}),
            'timestamp': ('django.db.models.fields.DateTimeField', [], {}),
            'timezone': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'title': ('django.db.models.fields.CharField', [], {'max_length': '64', 'blank': 'True'}),
            'view': ('django.db.models.fields.CharField', [], {'max_length': '64', 'blank': 'True'}),
            'width': ('django.db.models.fields.IntegerField', [], {'null': 'True', 'blank': 'True'})
        },
        'spud.photo_album': {
            'Meta': {'object_name': 'photo_album', 'db_table': "u'zoph_photo_albums'"},
            'album': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['spud.album']"}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'photo': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['spud.photo']"})
        },
        'spud.photo_category': {
            'Meta': {'object_name': 'photo_category', 'db_table': "u'zoph_photo_categories'"},
            'category': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['spud.category']"}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'photo': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['spud.photo']"})
        },
        'spud.photo_person': {
            'Meta': {'object_name': 'photo_person', 'db_table': "u'zoph_photo_people'"},
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'person': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['spud.person']"}),
            'photo': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['spud.photo']"}),
            'position': ('django.db.models.fields.IntegerField', [], {'null': 'True', 'blank': 'True'})
        },
        'spud.photo_relation': {
            'Meta': {'object_name': 'photo_relation', 'db_table': "u'zoph_photo_relations'"},
            'desc_1': ('django.db.models.fields.CharField', [], {'max_length': '384'}),
            'desc_2': ('django.db.models.fields.CharField', [], {'max_length': '384'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'photo_1': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'relations_1'", 'db_column': "'photo_id_1'", 'to': "orm['spud.photo']"}),
            'photo_2': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'relations_2'", 'db_column': "'photo_id_2'", 'to': "orm['spud.photo']"})
        },
        'spud.place': {
            'Meta': {'object_name': 'place', 'db_table': "u'zoph_places'"},
            'address': ('django.db.models.fields.CharField', [], {'max_length': '192', 'blank': 'True'}),
            'address2': ('django.db.models.fields.CharField', [], {'max_length': '192', 'blank': 'True'}),
            'city': ('django.db.models.fields.CharField', [], {'max_length': '96', 'blank': 'True'}),
            'country': ('django.db.models.fields.CharField', [], {'max_length': '96', 'blank': 'True'}),
            'coverphoto': ('django.db.models.fields.related.ForeignKey', [], {'blank': 'True', 'related_name': "'place_cover_of'", 'null': 'True', 'db_column': "'coverphoto'", 'to': "orm['spud.photo']"}),
            'notes': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'parent_place': ('django.db.models.fields.related.ForeignKey', [], {'blank': 'True', 'related_name': "'children'", 'null': 'True', 'to': "orm['spud.place']"}),
            'place_id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'state': ('django.db.models.fields.CharField', [], {'max_length': '96', 'blank': 'True'}),
            'title': ('django.db.models.fields.CharField', [], {'max_length': '192', 'db_index': 'True'}),
            'url': ('django.db.models.fields.CharField', [], {'max_length': '3072', 'blank': 'True'}),
            'urldesc': ('django.db.models.fields.CharField', [], {'max_length': '96', 'blank': 'True'}),
            'zip': ('django.db.models.fields.CharField', [], {'max_length': '30', 'blank': 'True'})
        }
    }
    
    complete_apps = ['spud']
