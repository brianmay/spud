# encoding: utf-8
import datetime
from south.db import db
from south.v2 import DataMigration
from django.db import models


def _ascendants_glue(instance, position, seen, cache, parent_attributes):
    glue = []
    if instance is None:
        return glue

    if instance.pk in cache:
        print "<--- getting", instance.pk,  [(i[0], i[1]+position) for i in cache[instance.pk]]
        return [(i[0], i[1]+position) for i in cache[instance.pk]]

    if instance.pk in seen:
        print "<--- loop detected", instance.pk
        return glue

    glue.append((instance.pk, position))

    seen[instance.pk] = True
    for attr in parent_attributes:
        parent = getattr(instance, attr)
        if parent is not None:
            print "descending", instance.pk, parent.pk
        new_glue = _ascendants_glue(
            parent, position+1, seen, cache, parent_attributes)
        # make sure there are no duplicates
        # duplicates can happen if ancestors appear more then once in tree,
        # e.g. if cousins marry.
        for item in new_glue:
            if item not in glue:
                glue.append(item)

    print "---> caching", instance.pk, [(i[0], i[1]-position) for i in glue]
    cache[instance.pk] = [(i[0], i[1]-position) for i in glue]
    return glue


def _fix_ascendants(self, parent_attributes, glue_class, cache, do_descendants):
    if cache is None:
        cache={}

    if do_descendants:
        instance_list = list(self.get_descendants(True))
        # if descendants list is length 0 it is invalid,
        # should include self
        if len(instance_list) == 0:
            instance_list = [self]
            instance_list.extend(self.children.all())
    else:
        instance_list = [self]

    print "((("
    for instance in instance_list:
        new_glue = _ascendants_glue(instance, 0, {}, cache, parent_attributes)
        print "----"
        print instance, instance.pk
        print "ng", [(i[0], i[1]) for i in new_glue]
        print "cache", cache.keys()

        old_glue = [
            (i.ascendant.pk, i.position)
            for i in instance.ascendant_set.all()]

        print "og1", old_glue

        for glue in new_glue:
            if glue in old_glue:
                print "nothing", glue
                old_glue.remove(glue)
            else:
                print "adding", glue
                ascendant = type(self).objects.get(pk=glue[0])
                glue_class.objects.create(
                    ascendant=ascendant, descendant=self, position=glue[1])

        for glue in old_glue:
            print "removing", glue
            glue_class.objects.filter(
                ascendant__pk=glue[0], descendant=self, position=glue[1]
            ).delete()
    print ")))"


class Migration(DataMigration):

    def forwards(self, orm):
        cache = {}
        for album in orm.album.objects.all():
            _fix_ascendants(
                album, ["parent_album"], orm.album_ascendant, cache, False)

        cache = {}
        for category in orm.category.objects.all():
            _fix_ascendants(
                category, ["parent_category"], orm.category_ascendant, cache, False)

        cache = {}
        for place in orm.place.objects.all():
            _fix_ascendants(
                place, ["parent_place"], orm.place_ascendant, cache, False)

        cache = {}
        for person in orm.person.objects.all():
            _fix_ascendants(
                person, ["mother", "father"], orm.person_ascendant, cache, False)



    def backwards(self, orm):
        pass


    models = {
        u'spud.album': {
            'Meta': {'ordering': "['sortname', 'sortorder', 'album']", 'object_name': 'album'},
            'album': ('django.db.models.fields.CharField', [], {'max_length': '96', 'db_index': 'True'}),
            'album_description': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'album_id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'ascendants': ('django.db.models.fields.related.ManyToManyField', [], {'related_name': "'descendants'", 'symmetrical': 'False', 'through': u"orm['spud.album_ascendant']", 'to': u"orm['spud.album']"}),
            'cover_photo': ('django.db.models.fields.related.ForeignKey', [], {'blank': 'True', 'related_name': "'album_cover_of'", 'null': 'True', 'to': u"orm['spud.photo']"}),
            'parent_album': ('django.db.models.fields.related.ForeignKey', [], {'blank': 'True', 'related_name': "'children'", 'null': 'True', 'to': u"orm['spud.album']"}),
            'revised': ('django.db.models.fields.DateTimeField', [], {'null': 'True', 'blank': 'True'}),
            'sortname': ('django.db.models.fields.CharField', [], {'max_length': '96', 'blank': 'True'}),
            'sortorder': ('django.db.models.fields.CharField', [], {'max_length': '96', 'blank': 'True'})
        },
        u'spud.album_ascendant': {
            'Meta': {'ordering': "['position']", 'object_name': 'album_ascendant'},
            'ascendant': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'descendant_set'", 'to': u"orm['spud.album']"}),
            'descendant': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'ascendant_set'", 'to': u"orm['spud.album']"}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'position': ('django.db.models.fields.IntegerField', [], {})
        },
        u'spud.category': {
            'Meta': {'ordering': "['sortname', 'sortorder', 'category']", 'object_name': 'category'},
            'ascendants': ('django.db.models.fields.related.ManyToManyField', [], {'related_name': "'descendants'", 'symmetrical': 'False', 'through': u"orm['spud.category_ascendant']", 'to': u"orm['spud.category']"}),
            'category': ('django.db.models.fields.CharField', [], {'max_length': '96', 'db_index': 'True'}),
            'category_description': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'category_id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'cover_photo': ('django.db.models.fields.related.ForeignKey', [], {'blank': 'True', 'related_name': "'category_cover_of'", 'null': 'True', 'to': u"orm['spud.photo']"}),
            'parent_category': ('django.db.models.fields.related.ForeignKey', [], {'blank': 'True', 'related_name': "'children'", 'null': 'True', 'to': u"orm['spud.category']"}),
            'sortname': ('django.db.models.fields.CharField', [], {'max_length': '96', 'blank': 'True'}),
            'sortorder': ('django.db.models.fields.CharField', [], {'max_length': '96', 'blank': 'True'})
        },
        u'spud.category_ascendant': {
            'Meta': {'ordering': "['position']", 'object_name': 'category_ascendant'},
            'ascendant': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'descendant_set'", 'to': u"orm['spud.category']"}),
            'descendant': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'ascendant_set'", 'to': u"orm['spud.category']"}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'position': ('django.db.models.fields.IntegerField', [], {})
        },
        u'spud.person': {
            'Meta': {'ordering': "['last_name', 'first_name']", 'object_name': 'person'},
            'ascendants': ('django.db.models.fields.related.ManyToManyField', [], {'related_name': "'descendants'", 'symmetrical': 'False', 'through': u"orm['spud.person_ascendant']", 'to': u"orm['spud.person']"}),
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
            'Meta': {'ordering': "['datetime']", 'object_name': 'photo'},
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
            'ascendants': ('django.db.models.fields.related.ManyToManyField', [], {'related_name': "'descendants'", 'symmetrical': 'False', 'through': u"orm['spud.place_ascendant']", 'to': u"orm['spud.place']"}),
            'city': ('django.db.models.fields.CharField', [], {'max_length': '96', 'blank': 'True'}),
            'country': ('django.db.models.fields.CharField', [], {'max_length': '96', 'blank': 'True'}),
            'cover_photo': ('django.db.models.fields.related.ForeignKey', [], {'blank': 'True', 'related_name': "'place_cover_of'", 'null': 'True', 'to': u"orm['spud.photo']"}),
            'notes': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'parent_place': ('django.db.models.fields.related.ForeignKey', [], {'blank': 'True', 'related_name': "'children'", 'null': 'True', 'to': u"orm['spud.place']"}),
            'place_id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'state': ('django.db.models.fields.CharField', [], {'max_length': '96', 'blank': 'True'}),
            'title': ('django.db.models.fields.CharField', [], {'max_length': '192', 'db_index': 'True'}),
            'url': ('django.db.models.fields.CharField', [], {'max_length': '3072', 'blank': 'True'}),
            'urldesc': ('django.db.models.fields.CharField', [], {'max_length': '96', 'blank': 'True'}),
            'zip': ('django.db.models.fields.CharField', [], {'max_length': '30', 'blank': 'True'})
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
