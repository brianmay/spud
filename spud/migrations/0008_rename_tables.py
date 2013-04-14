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
        
        # Adding model 'album_new'
        db.create_table(u'spud_album', (
            ('parent_album', self.gf('django.db.models.fields.related.ForeignKey')(blank=True, related_name='children', null=True, to=orm['spud.album_new'])),
            ('album', self.gf('django.db.models.fields.CharField')(max_length=96, db_index=True)),
            ('revised', self.gf('django.db.models.fields.DateTimeField')(null=True, blank=True)),
            ('sortname', self.gf('django.db.models.fields.CharField')(max_length=96, blank=True)),
            ('album_id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('cover_photo', self.gf('django.db.models.fields.related.ForeignKey')(blank=True, related_name='album_cover_of', null=True, to=orm['spud.photo_new'])),
            ('album_description', self.gf('django.db.models.fields.TextField')(blank=True)),
            ('sortorder', self.gf('django.db.models.fields.CharField')(max_length=96, blank=True)),
        ))
        db.send_create_signal('spud', ['album_new'])

        # Adding model 'photo_relation_new'
        db.create_table(u'spud_photo_relation', (
            ('desc_1', self.gf('django.db.models.fields.CharField')(max_length=384)),
            ('photo_2', self.gf('django.db.models.fields.related.ForeignKey')(related_name='relations_2', db_column='photo_id_2', to=orm['spud.photo_new'])),
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('desc_2', self.gf('django.db.models.fields.CharField')(max_length=384)),
            ('photo_1', self.gf('django.db.models.fields.related.ForeignKey')(related_name='relations_1', db_column='photo_id_1', to=orm['spud.photo_new'])),
        ))
        db.send_create_signal('spud', ['photo_relation_new'])

        # Adding model 'place_new'
        db.create_table(u'spud_place', (
            ('parent_place', self.gf('django.db.models.fields.related.ForeignKey')(blank=True, related_name='children', null=True, to=orm['spud.place_new'])),
            ('city', self.gf('django.db.models.fields.CharField')(max_length=96, blank=True)),
            ('urldesc', self.gf('django.db.models.fields.CharField')(max_length=96, blank=True)),
            ('zip', self.gf('django.db.models.fields.CharField')(max_length=30, blank=True)),
            ('title', self.gf('django.db.models.fields.CharField')(max_length=192, db_index=True)),
            ('url', self.gf('django.db.models.fields.CharField')(max_length=3072, blank=True)),
            ('country', self.gf('django.db.models.fields.CharField')(max_length=96, blank=True)),
            ('address2', self.gf('django.db.models.fields.CharField')(max_length=192, blank=True)),
            ('place_id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('state', self.gf('django.db.models.fields.CharField')(max_length=96, blank=True)),
            ('cover_photo', self.gf('django.db.models.fields.related.ForeignKey')(blank=True, related_name='place_cover_of', null=True, to=orm['spud.photo_new'])),
            ('address', self.gf('django.db.models.fields.CharField')(max_length=192, blank=True)),
            ('notes', self.gf('django.db.models.fields.TextField')(blank=True)),
        ))
        db.send_create_signal('spud', ['place_new'])

        # Adding model 'photo_album_new'
        db.create_table(u'spud_photo_album', (
            ('album', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['spud.album_new'])),
            ('photo', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['spud.photo_new'])),
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
        ))
        db.send_create_signal('spud', ['photo_album_new'])

        # Adding model 'photo_new'
        db.create_table(u'spud_photo', (
            ('comment', self.gf('django.db.models.fields.TextField')(blank=True)),
            ('rating', self.gf('django.db.models.fields.FloatField')(db_index=True, null=True, blank=True)),
            ('flash_used', self.gf('django.db.models.fields.CharField')(max_length=1, blank=True)),
            ('metering_mode', self.gf('django.db.models.fields.CharField')(max_length=32, blank=True)),
            ('datetime', self.gf('django.db.models.fields.DateTimeField')(db_index=True)),
            ('timezone', self.gf('django.db.models.fields.CharField')(max_length=100)),
            ('size', self.gf('django.db.models.fields.IntegerField')(null=True, blank=True)),
            ('compression', self.gf('django.db.models.fields.CharField')(max_length=64, blank=True)),
            ('title', self.gf('django.db.models.fields.CharField')(db_index=True, max_length=64, blank=True)),
            ('photographer', self.gf('django.db.models.fields.related.ForeignKey')(blank=True, related_name='photographed', null=True, to=orm['spud.person_new'])),
            ('width', self.gf('django.db.models.fields.IntegerField')(null=True, blank=True)),
            ('location', self.gf('django.db.models.fields.related.ForeignKey')(blank=True, related_name='photos', null=True, to=orm['spud.place_new'])),
            ('aperture', self.gf('django.db.models.fields.CharField')(max_length=16, blank=True)),
            ('ccd_width', self.gf('django.db.models.fields.CharField')(max_length=16, blank=True)),
            ('description', self.gf('django.db.models.fields.TextField')(blank=True)),
            ('timestamp', self.gf('django.db.models.fields.DateTimeField')()),
            ('iso_equiv', self.gf('django.db.models.fields.CharField')(max_length=8, blank=True)),
            ('focal_length', self.gf('django.db.models.fields.CharField')(max_length=64, blank=True)),
            ('path', self.gf('django.db.models.fields.CharField')(db_index=True, max_length=255, blank=True)),
            ('height', self.gf('django.db.models.fields.IntegerField')(null=True, blank=True)),
            ('exposure', self.gf('django.db.models.fields.CharField')(max_length=64, blank=True)),
            ('photo_id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('name', self.gf('django.db.models.fields.CharField')(db_index=True, max_length=128, blank=True)),
            ('level', self.gf('django.db.models.fields.IntegerField')()),
            ('camera_make', self.gf('django.db.models.fields.CharField')(max_length=32, blank=True)),
            ('camera_model', self.gf('django.db.models.fields.CharField')(max_length=32, blank=True)),
            ('focus_dist', self.gf('django.db.models.fields.CharField')(max_length=16, blank=True)),
            ('action', self.gf('django.db.models.fields.CharField')(db_index=True, max_length=4, null=True, blank=True)),
            ('view', self.gf('django.db.models.fields.CharField')(max_length=64, blank=True)),
        ))
        db.send_create_signal('spud', ['photo_new'])

        # Adding model 'category_new'
        db.create_table(u'spud_category', (
            ('category', self.gf('django.db.models.fields.CharField')(max_length=96, db_index=True)),
            ('sortname', self.gf('django.db.models.fields.CharField')(max_length=96, blank=True)),
            ('cover_photo', self.gf('django.db.models.fields.related.ForeignKey')(blank=True, related_name='category_cover_of', null=True, to=orm['spud.photo_new'])),
            ('parent_category', self.gf('django.db.models.fields.related.ForeignKey')(blank=True, related_name='children', null=True, to=orm['spud.category_new'])),
            ('sortorder', self.gf('django.db.models.fields.CharField')(max_length=96, blank=True)),
            ('category_description', self.gf('django.db.models.fields.TextField')(blank=True)),
            ('category_id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
        ))
        db.send_create_signal('spud', ['category_new'])

        # Adding model 'photo_category_new'
        db.create_table(u'spud_photo_category', (
            ('category', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['spud.category_new'])),
            ('photo', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['spud.photo_new'])),
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
        ))
        db.send_create_signal('spud', ['photo_category_new'])

        # Adding model 'photo_person_new'
        db.create_table(u'spud_photo_person', (
            ('photo', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['spud.photo_new'])),
            ('position', self.gf('django.db.models.fields.IntegerField')(null=True, blank=True)),
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('person', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['spud.person_new'])),
        ))
        db.send_create_signal('spud', ['photo_person_new'])

        # Adding model 'person_new'
        db.create_table(u'spud_person', (
            ('first_name', self.gf('django.db.models.fields.CharField')(db_index=True, max_length=96, blank=True)),
            ('last_name', self.gf('django.db.models.fields.CharField')(db_index=True, max_length=96, blank=True)),
            ('middle_name', self.gf('django.db.models.fields.CharField')(max_length=96, blank=True)),
            ('dob', self.gf('django.db.models.fields.DateField')(null=True, blank=True)),
            ('gender', self.gf('django.db.models.fields.CharField')(max_length=1, blank=True)),
            ('notes', self.gf('django.db.models.fields.TextField')(blank=True)),
            ('work', self.gf('django.db.models.fields.related.ForeignKey')(blank=True, related_name='work_of', null=True, to=orm['spud.place_new'])),
            ('father', self.gf('django.db.models.fields.related.ForeignKey')(blank=True, related_name='father_of', null=True, to=orm['spud.person_new'])),
            ('dod', self.gf('django.db.models.fields.DateField')(null=True, blank=True)),
            ('email', self.gf('django.db.models.fields.CharField')(max_length=192, blank=True)),
            ('cover_photo', self.gf('django.db.models.fields.related.ForeignKey')(blank=True, related_name='person_cover_of', null=True, to=orm['spud.photo_new'])),
            ('mother', self.gf('django.db.models.fields.related.ForeignKey')(blank=True, related_name='mother_of', null=True, to=orm['spud.person_new'])),
            ('person_id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('home', self.gf('django.db.models.fields.related.ForeignKey')(blank=True, related_name='home_of', null=True, to=orm['spud.place_new'])),
            ('spouse', self.gf('django.db.models.fields.related.ForeignKey')(blank=True, related_name='reverse_spouses', null=True, to=orm['spud.person_new'])),
            ('called', self.gf('django.db.models.fields.CharField')(max_length=48, blank=True)),
        ))
        db.send_create_signal('spud', ['person_new'])
    
    
    def backwards(self, orm):
        
        # Deleting model 'album_new'
        db.delete_table(u'spud_album')

        # Deleting model 'photo_relation_new'
        db.delete_table(u'spud_photo_relation')

        # Deleting model 'place_new'
        db.delete_table(u'spud_place')

        # Deleting model 'photo_album_new'
        db.delete_table(u'spud_photo_album')

        # Deleting model 'photo_new'
        db.delete_table(u'spud_photo')

        # Deleting model 'category_new'
        db.delete_table(u'spud_category')

        # Deleting model 'photo_category_new'
        db.delete_table(u'spud_photo_category')

        # Deleting model 'photo_person_new'
        db.delete_table(u'spud_photo_person')

        # Deleting model 'person_new'
        db.delete_table(u'spud_person')
    
    
    models = {
        'spud.album': {
            'Meta': {'object_name': 'album', 'db_table': "u'zoph_albums'"},
            'album': ('django.db.models.fields.CharField', [], {'max_length': '96', 'db_index': 'True'}),
            'album_description': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'album_id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'cover_photo': ('django.db.models.fields.related.ForeignKey', [], {'blank': 'True', 'related_name': "'album_cover_of'", 'null': 'True', 'to': "orm['spud.photo']"}),
            'parent_album': ('django.db.models.fields.related.ForeignKey', [], {'blank': 'True', 'related_name': "'children'", 'null': 'True', 'to': "orm['spud.album']"}),
            'revised': ('django.db.models.fields.DateTimeField', [], {'null': 'True', 'blank': 'True'}),
            'sortname': ('django.db.models.fields.CharField', [], {'max_length': '96', 'blank': 'True'}),
            'sortorder': ('django.db.models.fields.CharField', [], {'max_length': '96', 'blank': 'True'})
        },
        'spud.album_new': {
            'Meta': {'object_name': 'album_new', 'db_table': "u'spud_album'"},
            'album': ('django.db.models.fields.CharField', [], {'max_length': '96', 'db_index': 'True'}),
            'album_description': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'album_id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'cover_photo': ('django.db.models.fields.related.ForeignKey', [], {'blank': 'True', 'related_name': "'album_cover_of'", 'null': 'True', 'to': "orm['spud.photo_new']"}),
            'parent_album': ('django.db.models.fields.related.ForeignKey', [], {'blank': 'True', 'related_name': "'children'", 'null': 'True', 'to': "orm['spud.album_new']"}),
            'revised': ('django.db.models.fields.DateTimeField', [], {'null': 'True', 'blank': 'True'}),
            'sortname': ('django.db.models.fields.CharField', [], {'max_length': '96', 'blank': 'True'}),
            'sortorder': ('django.db.models.fields.CharField', [], {'max_length': '96', 'blank': 'True'})
        },
        'spud.category': {
            'Meta': {'object_name': 'category', 'db_table': "u'zoph_categories'"},
            'category': ('django.db.models.fields.CharField', [], {'max_length': '96', 'db_index': 'True'}),
            'category_description': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'category_id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'cover_photo': ('django.db.models.fields.related.ForeignKey', [], {'blank': 'True', 'related_name': "'category_cover_of'", 'null': 'True', 'to': "orm['spud.photo']"}),
            'parent_category': ('django.db.models.fields.related.ForeignKey', [], {'blank': 'True', 'related_name': "'children'", 'null': 'True', 'to': "orm['spud.category']"}),
            'sortname': ('django.db.models.fields.CharField', [], {'max_length': '96', 'blank': 'True'}),
            'sortorder': ('django.db.models.fields.CharField', [], {'max_length': '96', 'blank': 'True'})
        },
        'spud.category_new': {
            'Meta': {'object_name': 'category_new', 'db_table': "u'spud_category'"},
            'category': ('django.db.models.fields.CharField', [], {'max_length': '96', 'db_index': 'True'}),
            'category_description': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'category_id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'cover_photo': ('django.db.models.fields.related.ForeignKey', [], {'blank': 'True', 'related_name': "'category_cover_of'", 'null': 'True', 'to': "orm['spud.photo_new']"}),
            'parent_category': ('django.db.models.fields.related.ForeignKey', [], {'blank': 'True', 'related_name': "'children'", 'null': 'True', 'to': "orm['spud.category_new']"}),
            'sortname': ('django.db.models.fields.CharField', [], {'max_length': '96', 'blank': 'True'}),
            'sortorder': ('django.db.models.fields.CharField', [], {'max_length': '96', 'blank': 'True'})
        },
        'spud.person': {
            'Meta': {'object_name': 'person', 'db_table': "u'zoph_people'"},
            'called': ('django.db.models.fields.CharField', [], {'max_length': '48', 'blank': 'True'}),
            'cover_photo': ('django.db.models.fields.related.ForeignKey', [], {'blank': 'True', 'related_name': "'person_cover_of'", 'null': 'True', 'to': "orm['spud.photo']"}),
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
        'spud.person_new': {
            'Meta': {'object_name': 'person_new', 'db_table': "u'spud_person'"},
            'called': ('django.db.models.fields.CharField', [], {'max_length': '48', 'blank': 'True'}),
            'cover_photo': ('django.db.models.fields.related.ForeignKey', [], {'blank': 'True', 'related_name': "'person_cover_of'", 'null': 'True', 'to': "orm['spud.photo_new']"}),
            'dob': ('django.db.models.fields.DateField', [], {'null': 'True', 'blank': 'True'}),
            'dod': ('django.db.models.fields.DateField', [], {'null': 'True', 'blank': 'True'}),
            'email': ('django.db.models.fields.CharField', [], {'max_length': '192', 'blank': 'True'}),
            'father': ('django.db.models.fields.related.ForeignKey', [], {'blank': 'True', 'related_name': "'father_of'", 'null': 'True', 'to': "orm['spud.person_new']"}),
            'first_name': ('django.db.models.fields.CharField', [], {'db_index': 'True', 'max_length': '96', 'blank': 'True'}),
            'gender': ('django.db.models.fields.CharField', [], {'max_length': '1', 'blank': 'True'}),
            'home': ('django.db.models.fields.related.ForeignKey', [], {'blank': 'True', 'related_name': "'home_of'", 'null': 'True', 'to': "orm['spud.place_new']"}),
            'last_name': ('django.db.models.fields.CharField', [], {'db_index': 'True', 'max_length': '96', 'blank': 'True'}),
            'middle_name': ('django.db.models.fields.CharField', [], {'max_length': '96', 'blank': 'True'}),
            'mother': ('django.db.models.fields.related.ForeignKey', [], {'blank': 'True', 'related_name': "'mother_of'", 'null': 'True', 'to': "orm['spud.person_new']"}),
            'notes': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'person_id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'spouse': ('django.db.models.fields.related.ForeignKey', [], {'blank': 'True', 'related_name': "'reverse_spouses'", 'null': 'True', 'to': "orm['spud.person_new']"}),
            'work': ('django.db.models.fields.related.ForeignKey', [], {'blank': 'True', 'related_name': "'work_of'", 'null': 'True', 'to': "orm['spud.place_new']"})
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
            'timestamp': ('django.db.models.fields.DateTimeField', [], {}),
            'timezone': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'title': ('django.db.models.fields.CharField', [], {'db_index': 'True', 'max_length': '64', 'blank': 'True'}),
            'view': ('django.db.models.fields.CharField', [], {'max_length': '64', 'blank': 'True'}),
            'width': ('django.db.models.fields.IntegerField', [], {'null': 'True', 'blank': 'True'})
        },
        'spud.photo_album': {
            'Meta': {'object_name': 'photo_album', 'db_table': "u'zoph_photo_albums'"},
            'album': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['spud.album']"}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'photo': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['spud.photo']"})
        },
        'spud.photo_album_new': {
            'Meta': {'object_name': 'photo_album_new', 'db_table': "u'spud_photo_album'"},
            'album': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['spud.album_new']"}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'photo': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['spud.photo_new']"})
        },
        'spud.photo_category': {
            'Meta': {'object_name': 'photo_category', 'db_table': "u'zoph_photo_categories'"},
            'category': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['spud.category']"}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'photo': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['spud.photo']"})
        },
        'spud.photo_category_new': {
            'Meta': {'object_name': 'photo_category_new', 'db_table': "u'spud_photo_category'"},
            'category': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['spud.category_new']"}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'photo': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['spud.photo_new']"})
        },
        'spud.photo_new': {
            'Meta': {'object_name': 'photo_new', 'db_table': "u'spud_photo'"},
            'action': ('django.db.models.fields.CharField', [], {'db_index': 'True', 'max_length': '4', 'null': 'True', 'blank': 'True'}),
            'albums': ('django.db.models.fields.related.ManyToManyField', [], {'related_name': "'photos'", 'symmetrical': 'False', 'through': "orm['spud.photo_album_new']", 'to': "orm['spud.album_new']"}),
            'aperture': ('django.db.models.fields.CharField', [], {'max_length': '16', 'blank': 'True'}),
            'camera_make': ('django.db.models.fields.CharField', [], {'max_length': '32', 'blank': 'True'}),
            'camera_model': ('django.db.models.fields.CharField', [], {'max_length': '32', 'blank': 'True'}),
            'categorys': ('django.db.models.fields.related.ManyToManyField', [], {'related_name': "'photos'", 'symmetrical': 'False', 'through': "orm['spud.photo_category_new']", 'to': "orm['spud.category_new']"}),
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
            'location': ('django.db.models.fields.related.ForeignKey', [], {'blank': 'True', 'related_name': "'photos'", 'null': 'True', 'to': "orm['spud.place_new']"}),
            'metering_mode': ('django.db.models.fields.CharField', [], {'max_length': '32', 'blank': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'db_index': 'True', 'max_length': '128', 'blank': 'True'}),
            'path': ('django.db.models.fields.CharField', [], {'db_index': 'True', 'max_length': '255', 'blank': 'True'}),
            'persons': ('django.db.models.fields.related.ManyToManyField', [], {'related_name': "'photos'", 'symmetrical': 'False', 'through': "orm['spud.photo_person_new']", 'to': "orm['spud.person_new']"}),
            'photo_id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'photographer': ('django.db.models.fields.related.ForeignKey', [], {'blank': 'True', 'related_name': "'photographed'", 'null': 'True', 'to': "orm['spud.person_new']"}),
            'rating': ('django.db.models.fields.FloatField', [], {'db_index': 'True', 'null': 'True', 'blank': 'True'}),
            'relations': ('django.db.models.fields.related.ManyToManyField', [], {'to': "orm['spud.photo_new']", 'through': "orm['spud.photo_relation_new']", 'symmetrical': 'False'}),
            'size': ('django.db.models.fields.IntegerField', [], {'null': 'True', 'blank': 'True'}),
            'timestamp': ('django.db.models.fields.DateTimeField', [], {}),
            'timezone': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'title': ('django.db.models.fields.CharField', [], {'db_index': 'True', 'max_length': '64', 'blank': 'True'}),
            'view': ('django.db.models.fields.CharField', [], {'max_length': '64', 'blank': 'True'}),
            'width': ('django.db.models.fields.IntegerField', [], {'null': 'True', 'blank': 'True'})
        },
        'spud.photo_person': {
            'Meta': {'object_name': 'photo_person', 'db_table': "u'zoph_photo_people'"},
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'person': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['spud.person']"}),
            'photo': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['spud.photo']"}),
            'position': ('django.db.models.fields.IntegerField', [], {'null': 'True', 'blank': 'True'})
        },
        'spud.photo_person_new': {
            'Meta': {'object_name': 'photo_person_new', 'db_table': "u'spud_photo_person'"},
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'person': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['spud.person_new']"}),
            'photo': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['spud.photo_new']"}),
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
        'spud.photo_relation_new': {
            'Meta': {'object_name': 'photo_relation_new', 'db_table': "u'spud_photo_relation'"},
            'desc_1': ('django.db.models.fields.CharField', [], {'max_length': '384'}),
            'desc_2': ('django.db.models.fields.CharField', [], {'max_length': '384'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'photo_1': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'relations_1'", 'db_column': "'photo_id_1'", 'to': "orm['spud.photo_new']"}),
            'photo_2': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'relations_2'", 'db_column': "'photo_id_2'", 'to': "orm['spud.photo_new']"})
        },
        'spud.place': {
            'Meta': {'object_name': 'place', 'db_table': "u'zoph_places'"},
            'address': ('django.db.models.fields.CharField', [], {'max_length': '192', 'blank': 'True'}),
            'address2': ('django.db.models.fields.CharField', [], {'max_length': '192', 'blank': 'True'}),
            'city': ('django.db.models.fields.CharField', [], {'max_length': '96', 'blank': 'True'}),
            'country': ('django.db.models.fields.CharField', [], {'max_length': '96', 'blank': 'True'}),
            'cover_photo': ('django.db.models.fields.related.ForeignKey', [], {'blank': 'True', 'related_name': "'place_cover_of'", 'null': 'True', 'to': "orm['spud.photo']"}),
            'notes': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'parent_place': ('django.db.models.fields.related.ForeignKey', [], {'blank': 'True', 'related_name': "'children'", 'null': 'True', 'to': "orm['spud.place']"}),
            'place_id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'state': ('django.db.models.fields.CharField', [], {'max_length': '96', 'blank': 'True'}),
            'title': ('django.db.models.fields.CharField', [], {'max_length': '192', 'db_index': 'True'}),
            'url': ('django.db.models.fields.CharField', [], {'max_length': '3072', 'blank': 'True'}),
            'urldesc': ('django.db.models.fields.CharField', [], {'max_length': '96', 'blank': 'True'}),
            'zip': ('django.db.models.fields.CharField', [], {'max_length': '30', 'blank': 'True'})
        },
        'spud.place_new': {
            'Meta': {'object_name': 'place_new', 'db_table': "u'spud_place'"},
            'address': ('django.db.models.fields.CharField', [], {'max_length': '192', 'blank': 'True'}),
            'address2': ('django.db.models.fields.CharField', [], {'max_length': '192', 'blank': 'True'}),
            'city': ('django.db.models.fields.CharField', [], {'max_length': '96', 'blank': 'True'}),
            'country': ('django.db.models.fields.CharField', [], {'max_length': '96', 'blank': 'True'}),
            'cover_photo': ('django.db.models.fields.related.ForeignKey', [], {'blank': 'True', 'related_name': "'place_cover_of'", 'null': 'True', 'to': "orm['spud.photo_new']"}),
            'notes': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'parent_place': ('django.db.models.fields.related.ForeignKey', [], {'blank': 'True', 'related_name': "'children'", 'null': 'True', 'to': "orm['spud.place_new']"}),
            'place_id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'state': ('django.db.models.fields.CharField', [], {'max_length': '96', 'blank': 'True'}),
            'title': ('django.db.models.fields.CharField', [], {'max_length': '192', 'db_index': 'True'}),
            'url': ('django.db.models.fields.CharField', [], {'max_length': '3072', 'blank': 'True'}),
            'urldesc': ('django.db.models.fields.CharField', [], {'max_length': '96', 'blank': 'True'}),
            'zip': ('django.db.models.fields.CharField', [], {'max_length': '30', 'blank': 'True'})
        }
    }
    
    complete_apps = ['spud']
