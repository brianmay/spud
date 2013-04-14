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
        
        # Adding model 'place'
        db.create_table(u'zoph_places', (
            ('parent_place', self.gf('django.db.models.fields.related.ForeignKey')(blank=True, related_name='children', null=True, to=orm['spud.place'])),
            ('city', self.gf('django.db.models.fields.CharField')(max_length=96, blank=True)),
            ('urldesc', self.gf('django.db.models.fields.CharField')(max_length=96, blank=True)),
            ('zip', self.gf('django.db.models.fields.CharField')(max_length=30, blank=True)),
            ('title', self.gf('django.db.models.fields.CharField')(max_length=192, db_index=True)),
            ('url', self.gf('django.db.models.fields.CharField')(max_length=3072, blank=True)),
            ('country', self.gf('django.db.models.fields.CharField')(max_length=96, blank=True)),
            ('address2', self.gf('django.db.models.fields.CharField')(max_length=192, blank=True)),
            ('place_id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('state', self.gf('django.db.models.fields.CharField')(max_length=96, blank=True)),
            ('notes', self.gf('django.db.models.fields.TextField')(blank=True)),
            ('address', self.gf('django.db.models.fields.CharField')(max_length=192, blank=True)),
            ('coverphoto', self.gf('django.db.models.fields.related.ForeignKey')(blank=True, related_name='place_cover_of', null=True, db_column='coverphoto', to=orm['spud.photo'])),
        ))
        db.send_create_signal('spud', ['place'])

        # Adding model 'album'
        db.create_table(u'zoph_albums', (
            ('parent_album', self.gf('django.db.models.fields.related.ForeignKey')(blank=True, related_name='children', null=True, to=orm['spud.album'])),
            ('album', self.gf('django.db.models.fields.CharField')(max_length=96, db_index=True)),
            ('sortname', self.gf('django.db.models.fields.CharField')(max_length=96, blank=True)),
            ('album_id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('revised', self.gf('django.db.models.fields.DateTimeField')(null=True, blank=True)),
            ('album_description', self.gf('django.db.models.fields.TextField')(blank=True)),
            ('sortorder', self.gf('django.db.models.fields.CharField')(max_length=96, blank=True)),
            ('coverphoto', self.gf('django.db.models.fields.related.ForeignKey')(blank=True, related_name='album_cover_of', null=True, db_column='coverphoto', to=orm['spud.photo'])),
        ))
        db.send_create_signal('spud', ['album'])

        # Adding model 'category'
        db.create_table(u'zoph_categories', (
            ('category', self.gf('django.db.models.fields.CharField')(max_length=96, db_index=True)),
            ('sortname', self.gf('django.db.models.fields.CharField')(max_length=96, blank=True)),
            ('parent_category', self.gf('django.db.models.fields.related.ForeignKey')(blank=True, related_name='children', null=True, to=orm['spud.category'])),
            ('sortorder', self.gf('django.db.models.fields.CharField')(max_length=96, blank=True)),
            ('category_description', self.gf('django.db.models.fields.TextField')(blank=True)),
            ('category_id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('coverphoto', self.gf('django.db.models.fields.related.ForeignKey')(blank=True, related_name='category_cover_of', null=True, db_column='coverphoto', to=orm['spud.photo'])),
        ))
        db.send_create_signal('spud', ['category'])

        # Adding model 'person'
        db.create_table(u'zoph_people', (
            ('first_name', self.gf('django.db.models.fields.CharField')(db_index=True, max_length=96, blank=True)),
            ('last_name', self.gf('django.db.models.fields.CharField')(db_index=True, max_length=96, blank=True)),
            ('middle_name', self.gf('django.db.models.fields.CharField')(max_length=96, blank=True)),
            ('dob', self.gf('django.db.models.fields.DateField')(null=True, blank=True)),
            ('gender', self.gf('django.db.models.fields.CharField')(max_length=1, blank=True)),
            ('notes', self.gf('django.db.models.fields.TextField')(blank=True)),
            ('work', self.gf('django.db.models.fields.related.ForeignKey')(blank=True, related_name='work_of', null=True, to=orm['spud.place'])),
            ('father', self.gf('django.db.models.fields.related.ForeignKey')(blank=True, related_name='father_of', null=True, to=orm['spud.person'])),
            ('dod', self.gf('django.db.models.fields.DateField')(null=True, blank=True)),
            ('coverphoto', self.gf('django.db.models.fields.related.ForeignKey')(blank=True, related_name='person_cover_of', null=True, db_column='coverphoto', to=orm['spud.photo'])),
            ('email', self.gf('django.db.models.fields.CharField')(max_length=192, blank=True)),
            ('mother', self.gf('django.db.models.fields.related.ForeignKey')(blank=True, related_name='mother_of', null=True, to=orm['spud.person'])),
            ('person_id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('home', self.gf('django.db.models.fields.related.ForeignKey')(blank=True, related_name='home_of', null=True, to=orm['spud.place'])),
            ('spouse', self.gf('django.db.models.fields.related.ForeignKey')(blank=True, related_name='reverse_spouses', null=True, to=orm['spud.person'])),
            ('called', self.gf('django.db.models.fields.CharField')(max_length=48, blank=True)),
        ))
        db.send_create_signal('spud', ['person'])

        # Adding model 'photo'
        db.create_table(u'zoph_photos', (
            ('comment', self.gf('django.db.models.fields.TextField')(blank=True)),
            ('rating', self.gf('django.db.models.fields.FloatField')(db_index=True, null=True, blank=True)),
            ('flash_used', self.gf('django.db.models.fields.CharField')(max_length=1, blank=True)),
            ('metering_mode', self.gf('django.db.models.fields.CharField')(max_length=32, blank=True)),
            ('datetime', self.gf('django.db.models.fields.DateTimeField')(db_index=True)),
            ('timezone', self.gf('django.db.models.fields.CharField')(max_length=100)),
            ('size', self.gf('django.db.models.fields.IntegerField')(null=True, blank=True)),
            ('compression', self.gf('django.db.models.fields.CharField')(max_length=64, blank=True)),
            ('title', self.gf('django.db.models.fields.CharField')(max_length=64, blank=True)),
            ('photographer', self.gf('django.db.models.fields.related.ForeignKey')(blank=True, related_name='photographed', null=True, to=orm['spud.person'])),
            ('width', self.gf('django.db.models.fields.IntegerField')(null=True, blank=True)),
            ('location', self.gf('django.db.models.fields.related.ForeignKey')(blank=True, related_name='photos', null=True, to=orm['spud.place'])),
            ('aperture', self.gf('django.db.models.fields.CharField')(max_length=16, blank=True)),
            ('ccd_width', self.gf('django.db.models.fields.CharField')(max_length=16, blank=True)),
            ('status', self.gf('django.db.models.fields.CharField')(db_index=True, max_length=1, blank=True)),
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
            ('view', self.gf('django.db.models.fields.CharField')(max_length=64, blank=True)),
        ))
        db.send_create_signal('spud', ['photo'])

        # Adding model 'photo_album'
        db.create_table(u'zoph_photo_albums', (
            ('album', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['spud.album'])),
            ('photo', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['spud.photo'])),
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
        ))
        db.send_create_signal('spud', ['photo_album'])

        # Adding model 'photo_category'
        db.create_table(u'zoph_photo_categories', (
            ('category', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['spud.category'])),
            ('photo', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['spud.photo'])),
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
        ))
        db.send_create_signal('spud', ['photo_category'])

        # Adding model 'photo_person'
        db.create_table(u'zoph_photo_people', (
            ('photo', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['spud.photo'])),
            ('position', self.gf('django.db.models.fields.IntegerField')(null=True, blank=True)),
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('person', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['spud.person'])),
        ))
        db.send_create_signal('spud', ['photo_person'])

        # Adding model 'photo_relation'
        db.create_table(u'zoph_photo_relations', (
            ('desc_1', self.gf('django.db.models.fields.CharField')(max_length=384)),
            ('photo_2', self.gf('django.db.models.fields.related.ForeignKey')(related_name='relations_2', db_column='photo_id_2', to=orm['spud.photo'])),
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('desc_2', self.gf('django.db.models.fields.CharField')(max_length=384)),
            ('photo_1', self.gf('django.db.models.fields.related.ForeignKey')(related_name='relations_1', db_column='photo_id_1', to=orm['spud.photo'])),
        ))
        db.send_create_signal('spud', ['photo_relation'])

        # Adding model 'queer'
        db.create_table('spud_queer', (
            ('rotate', self.gf('django.db.models.fields.CharField')(max_length=4, null=True, blank=True)),
            ('name', self.gf('django.db.models.fields.CharField')(max_length=20)),
            ('update_description', self.gf('django.db.models.fields.TextField')(blank=True)),
            ('update_photographer', self.gf('django.db.models.fields.related.ForeignKey')(blank=True, related_name='queer_updates', null=True, to=orm['spud.person'])),
            ('update_status', self.gf('django.db.models.fields.CharField')(max_length=1, blank=True)),
            ('update_comment', self.gf('django.db.models.fields.TextField')(blank=True)),
            ('update_timezone', self.gf('django.db.models.fields.CharField')(max_length=100, blank=True)),
            ('update_title', self.gf('django.db.models.fields.CharField')(max_length=192, blank=True)),
            ('update_view', self.gf('django.db.models.fields.CharField')(max_length=192, blank=True)),
            ('update_location', self.gf('django.db.models.fields.related.ForeignKey')(blank=True, related_name='queer_updates', null=True, to=orm['spud.place'])),
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
    
    
    def backwards(self, orm):
        
        # Deleting model 'place'
        db.delete_table(u'zoph_places')

        # Deleting model 'album'
        db.delete_table(u'zoph_albums')

        # Deleting model 'category'
        db.delete_table(u'zoph_categories')

        # Deleting model 'person'
        db.delete_table(u'zoph_people')

        # Deleting model 'photo'
        db.delete_table(u'zoph_photos')

        # Deleting model 'photo_album'
        db.delete_table(u'zoph_photo_albums')

        # Deleting model 'photo_category'
        db.delete_table(u'zoph_photo_categories')

        # Deleting model 'photo_person'
        db.delete_table(u'zoph_photo_people')

        # Deleting model 'photo_relation'
        db.delete_table(u'zoph_photo_relations')

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
        },
        'spud.queer': {
            'Meta': {'object_name': 'queer'},
            'add_albums': ('django.db.models.fields.related.ManyToManyField', [], {'related_name': "'queer_adds'", 'symmetrical': 'False', 'to': "orm['spud.album']"}),
            'add_categorys': ('django.db.models.fields.related.ManyToManyField', [], {'related_name': "'queer_adds'", 'symmetrical': 'False', 'to': "orm['spud.category']"}),
            'add_persons': ('django.db.models.fields.related.ManyToManyField', [], {'related_name': "'queer_adds'", 'symmetrical': 'False', 'to': "orm['spud.person']"}),
            'delete_albums': ('django.db.models.fields.related.ManyToManyField', [], {'related_name': "'queer_deletes'", 'symmetrical': 'False', 'to': "orm['spud.album']"}),
            'delete_categorys': ('django.db.models.fields.related.ManyToManyField', [], {'related_name': "'queer_deletes'", 'symmetrical': 'False', 'to': "orm['spud.category']"}),
            'delete_persons': ('django.db.models.fields.related.ManyToManyField', [], {'related_name': "'queer_deletes'", 'symmetrical': 'False', 'to': "orm['spud.person']"}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '20'}),
            'rotate': ('django.db.models.fields.CharField', [], {'max_length': '4', 'null': 'True', 'blank': 'True'}),
            'update_comment': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'update_description': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'update_location': ('django.db.models.fields.related.ForeignKey', [], {'blank': 'True', 'related_name': "'queer_updates'", 'null': 'True', 'to': "orm['spud.place']"}),
            'update_photographer': ('django.db.models.fields.related.ForeignKey', [], {'blank': 'True', 'related_name': "'queer_updates'", 'null': 'True', 'to': "orm['spud.person']"}),
            'update_status': ('django.db.models.fields.CharField', [], {'max_length': '1', 'blank': 'True'}),
            'update_timezone': ('django.db.models.fields.CharField', [], {'max_length': '100', 'blank': 'True'}),
            'update_title': ('django.db.models.fields.CharField', [], {'max_length': '192', 'blank': 'True'}),
            'update_view': ('django.db.models.fields.CharField', [], {'max_length': '192', 'blank': 'True'})
        }
    }
    
    complete_apps = ['spud']
