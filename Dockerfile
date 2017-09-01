# Start with a Python image.
FROM python:3.6-stretch
MAINTAINER brian@linuxpenguins.xyz

# Some stuff that everyone has been copy-pasting
# since the dawn of time.
ENV PYTHONUNBUFFERED 1

# Make application directory
RUN mkdir -p /opt/spud /etc/spud
WORKDIR /opt/spud

# Install our requirements.
ADD requirements/*.txt /opt/spud/
RUN pip install -r requirements/docker.txt

# Copy all our files into the image.
COPY . /opt/spud/

# Specify the command to run when the image is run.
EXPOSE 8000
VOLUME /etc/spud
VOLUME /var/lib/spud/images
CMD /opt/spud/start.sh
